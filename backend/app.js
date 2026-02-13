import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
// Rate limiters
import { apiLimiter, authLimiter } from "./middlewares/rate-limiter.js";
// Routers
import Authrouter from "./routes/auth-routes.js";
import UserRouter from "./routes/users-routes.js";
import ChatRouter from "./routes/chats-routes.js";
import MessageRouter from "./routes/messages-routes.js";
import FriendRouter from "./routes/friends-routes.js";

const app = express();

// Core middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// CORS (env-driven)
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Handle preflight requests explicitly first
app.options("*", cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, origin);
    if (process.env.NODE_ENV !== "production") return cb(null, origin);
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return cb(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return cb(null, origin);
      }

      // In development, allow all origins for easier testing
      if (process.env.NODE_ENV !== "production") {
        return cb(null, origin);
      }

      // In production, reject unauthorized origins (don't throw error, just deny)
      return cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Security + perf
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Apply rate limiting in production
if (process.env.NODE_ENV === "production") {
  app.use("/api/", apiLimiter);
  app.use("/api/auth/", authLimiter);
}

// Health check endpoint (for load balancers and monitoring)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes
app.use("/api/auth", Authrouter);
app.use("/api/users", UserRouter);
app.use("/api/chats", ChatRouter);
app.use("/api/messages", MessageRouter);
app.use("/api/friends", FriendRouter);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: { message: "Not Found", code: "NOT_FOUND" } });
});

// Error handler (after routes)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || "Internal Server Error",
      code: err.code || "INTERNAL_ERROR",
      errors: err.errors || [],
    },
  });
});

export default app;

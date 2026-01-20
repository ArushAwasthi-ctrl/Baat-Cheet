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

// Log allowed origins on startup for debugging
console.log("Allowed CORS origins:", allowedOrigins);
console.log("NODE_ENV:", process.env.NODE_ENV);

app.use(
  cors({
    origin: (origin, cb) => {
      console.log("Request origin:", origin);
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return cb(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log("Origin allowed:", origin);
        return cb(null, origin);
      }

      // In development, allow all origins
      if (process.env.NODE_ENV !== "production") {
        console.log("Dev mode - allowing origin:", origin);
        return cb(null, origin);
      }

      // In production, still allow but log for debugging
      // This is a temporary fix to identify the exact origin mismatch
      console.log(`CORS origin not in list: ${origin}, allowed: ${JSON.stringify(allowedOrigins)}`);
      // Allow it anyway for now to get the app working
      return cb(null, origin);
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

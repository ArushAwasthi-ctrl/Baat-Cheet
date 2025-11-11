import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import Authrouter from "./routes/auth-routes.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res
    .status(status)
    .json({
      error: { message: err.message, code: err.code || "INTERNAL_ERROR" },
    });
});

// CORS
app.use(
  cors({
    origin: "http://localhost:3000", // replace with  frontend URL
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);
// Helmet for secure Apis
app.use(helmet());

// Routes
app.use("/api/auth", Authrouter);

export default app;

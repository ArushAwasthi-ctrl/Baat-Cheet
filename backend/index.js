import dotenv from "dotenv";
dotenv.config();
import http from "http";
import mongoose from "mongoose";
import dbCall from "./db/dbCall.js";
import app from "./app.js";
import redisCall, { redisClient } from "./redis/redisClient.js";

// Build MongoDB URI (prefer full URI from env)
const buildMongoUri = () => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const user = encodeURIComponent(process.env.DB_USERNAME || "");
  const pass = encodeURIComponent(process.env.DB_PASSWORD || "");
  const name = process.env.DB_NAME || "test";
  return `mongodb+srv://${user}:${pass}@cluster0.jyddd9o.mongodb.net/${name}`;
};

const mongoUri = buildMongoUri();
const PORT = process.env.PORT || 9990;
const redisUrl = String(process.env.REDIS_URL);

const server = http.createServer(app);

const startServer = async () => {
  try {
    // Connect MongoDB
    await dbCall(mongoUri);

    // Connect Redis
    await redisCall(redisUrl);

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`Server running on Port: ${PORT}`);
    });
  } catch (err) {
    console.error("Startup Error:", err);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  try {
    console.log(`Received ${signal}, shutting down gracefully...`);
    await redisClient?.quit?.();
    await mongoose.connection.close();
    server.close(() => {
      process.exit(0);
    });
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();

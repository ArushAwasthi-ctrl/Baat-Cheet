import dotenv from "dotenv";
dotenv.config();
import dbCall from "./db/dbCall.js";
import app from "./app.js";
import redisCall from "./redis/redisClient.js";
import { error, log } from "console";

// creating the mongoDb url
const dbUrl = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.jyddd9o.mongodb.net/${process.env.DB_NAME}`;
const PORT = process.env.PORT || 9990;
const redisUrl = String(process.env.REDIS_URL);
// start server
const startServer = async () => {
  try {
    // Connect MongoDB
    await dbCall(dbUrl);

    //  Connect Redis
    await redisCall(redisUrl);

    // Start Express
    app.listen(PORT, () => {
      console.log(`Server running on Port: ${PORT}`);
    });
  } catch (error) {
    console.error("Startup Error:", error);
    process.exit(1);
  }
};

startServer();

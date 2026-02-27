import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../models/Users.js";
import dbCall from "../db/dbCall.js";

const buildMongoUri = () => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const user = encodeURIComponent(process.env.DB_USERNAME || "");
  const pass = encodeURIComponent(process.env.DB_PASSWORD || "");
  const name = process.env.DB_NAME || "test";
  return `mongodb+srv://${user}:${pass}@cluster0.jyddd9o.mongodb.net/${name}`;
};

async function seed() {
  await dbCall(buildMongoUri());

  const existing = await User.findOne({ username: "AI Assistant" });
  if (existing) {
    console.log("AI user already exists:", existing._id);
    console.log("Add this to your .env: AI_SYSTEM_USER_ID=" + existing._id);
    await mongoose.connection.close();
    process.exit(0);
  }

  const aiUser = await User.create({
    username: "AI Assistant",
    email: "ai-assistant@baatcheet.system",
    password: "$2b$10$placeholder-hash-never-used-for-login",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ai-assistant",
    bio: "I'm an AI assistant. Mention @ai to ask me anything!",
    isVerified: true,
    status: "online",
  });

  console.log("AI system user created:", aiUser._id);
  console.log("Add this to your .env: AI_SYSTEM_USER_ID=" + aiUser._id);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

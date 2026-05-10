import "dotenv/config";
import mongoose from "mongoose";
import { Redis } from "ioredis";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";

const results = [];
const log = (svc, ok, msg) => results.push({ svc, ok, msg });

async function checkMongo() {
  try {
    const uri =
      process.env.MONGODB_URI ||
      `mongodb+srv://${process.env.DB_USERNAME}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_CLUSTER}/${process.env.DB_NAME}?retryWrites=true&w=majority`;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    await mongoose.connection.db.admin().ping();
    log("MongoDB Atlas", true, "Connected & pinged OK");
  } catch (e) {
    log("MongoDB Atlas", false, e.message);
  } finally {
    try { await mongoose.disconnect(); } catch {}
  }
}

async function checkRedis() {
  let client;
  try {
    client = new Redis(process.env.REDIS_URL, {
      connectTimeout: 8000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await client.connect();
    const pong = await client.ping();
    log("Redis (Upstash)", pong === "PONG", `PING -> ${pong}`);
  } catch (e) {
    log("Redis (Upstash)", false, e.message);
  } finally {
    try { client && client.disconnect(); } catch {}
  }
}

async function checkCloudinary() {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const res = await cloudinary.api.ping();
    log("Cloudinary", res.status === "ok", `status=${res.status}`);
  } catch (e) {
    log("Cloudinary", false, e.message);
  }
}

async function checkGroq() {
  try {
    const r = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });
    if (!r.ok) {
      const text = await r.text();
      log("Groq AI", false, `HTTP ${r.status}: ${text.slice(0, 200)}`);
    } else {
      const data = await r.json();
      log("Groq AI", true, `OK, ${data.data?.length ?? 0} models available`);
    }
  } catch (e) {
    log("Groq AI", false, e.message);
  }
}

async function checkSMTP() {
  try {
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    await t.verify();
    log("Gmail SMTP", true, `Verified as ${process.env.SMTP_USER}`);
  } catch (e) {
    log("Gmail SMTP", false, e.message);
  }
}

function checkMailtrap() {
  const u = process.env.MAIL_TRAP_USERNAME;
  const p = process.env.MAIL_TRAP_PASSWORD;
  if (!u || u.startsWith("your_") || !p || p.startsWith("your_")) {
    log("Mailtrap", false, "Placeholder values — never configured");
  } else {
    log("Mailtrap", true, "Has values (not verified)");
  }
}

function checkJwt() {
  const a = process.env.ACCESS_TOKEN_SECRET;
  const r = process.env.REFRESH_TOKEN_SECRET;
  log("JWT secrets", !!(a && r && a.length >= 32 && r.length >= 32),
    `access=${a?.length}ch refresh=${r?.length}ch (local secrets, don't expire)`);
}

(async () => {
  checkJwt();
  checkMailtrap();
  await Promise.all([checkMongo(), checkRedis(), checkCloudinary(), checkGroq(), checkSMTP()]);

  console.log("\n=== API Key / Service Health Report ===\n");
  for (const { svc, ok, msg } of results) {
    console.log(`${ok ? "[OK]    " : "[FAIL]  "} ${svc.padEnd(20)} ${msg}`);
  }
  process.exit(0);
})();

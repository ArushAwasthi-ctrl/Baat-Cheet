import dotenv from "dotenv";
import { Worker } from "bullmq";
import Redis from "ioredis";
import { sendEmail } from "../utils/mailgen.js";

dotenv.config();

// Create Redis connection for BullMQ
const getRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("REDIS_URL not set, using default localhost:6379");
    return undefined;
  }

  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

const worker = new Worker(
  "sendMail",
  async (job) => {
    const { email, subject, mailGenContent } = job.data;
    console.log(`Processing email job for ${email}`);
    await sendEmail({ email, subject, mailGenContent });
    console.log(`Email sent successfully to ${email}`);
  },
  {
    connection: getRedisConnection(),
  },
);

worker.on("completed", (job) => {
  console.log(` Job ${job.id} completed for ${job.data.email}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed for ${job?.data?.email}`, err);
});

export default worker;

import dotenv from "dotenv";
import { Queue } from "bullmq";
import Redis from "ioredis";

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

const emailQueue = new Queue("sendMail", {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export default emailQueue;

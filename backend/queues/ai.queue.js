import dotenv from "dotenv";
import { Queue } from "bullmq";
import Redis from "ioredis";

dotenv.config();

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

const aiQueue = new Queue("aiTasks", {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export default aiQueue;

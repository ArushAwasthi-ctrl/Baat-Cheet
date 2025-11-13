import dotenv from "dotenv";
import { Queue } from "bullmq";

dotenv.config();

const emailQueue = new Queue("sendMail", {
  // Use explicit Redis URL so BullMQ does not fall back to localhost:6379
  connection: process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : undefined,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: true, // keep failed ones for debugging
  },
});

export default emailQueue;

import dotenv from "dotenv";
import { Worker } from "bullmq";
import { sendEmail } from "../utils/mailgen.js";

dotenv.config();

const worker = new Worker(
  "sendMail",
  async (job) => {
    const { email, subject, mailGenContent } = job.data;
    console.log(`Processing email job for ${email}`);
    await sendEmail({ email, subject, mailGenContent });
    console.log(`Email sent successfully to ${email}`);
  },
  {
    // Use the same Redis URL as the main app; avoids BullMQ defaulting to 127.0.0.1:6379
    connection: process.env.REDIS_URL
      ? { url: process.env.REDIS_URL }
      : undefined,
  },
);

worker.on("completed", (job) => {
  console.log(` Job ${job.id} completed for ${job.data.email}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed for ${job?.data?.email}`, err);
});

export default worker;

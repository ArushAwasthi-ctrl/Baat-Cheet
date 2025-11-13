import Redis from "ioredis";

let redisClient;

const redisCall = async (redisUrl) => {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: redisUrl.startsWith("rediss://") ? {} : undefined,
    });

    redisClient.on("connect", () => console.log("Redis connected"));
    redisClient.on("error", (err) => console.error("Redis Error:", err));

  } catch (error) {
    console.error(`Error while connecting with Redis: ${error}`);
    process.exit(1);
  }
};

export { redisClient };
export default redisCall;

import { createClient } from "redis";
let redisClient;
const redisCall = async (redisUrl) => {
  try {
    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on("error", (err) => {
      console.error("Redis Error:", err);
    });
    await redisClient.connect();
    console.log("Redis connected");
  } catch (error) {
    console.error(`Error while connecting with Redis: ${error}`);
    process.exit(1); // stop server if Redis fails
  }
};

export { redisClient };
export default redisCall;

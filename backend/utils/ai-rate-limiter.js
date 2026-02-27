import { redisClient } from "../redis/redisClient.js";
import ApiError from "./api-error.js";

/**
 * Check and increment AI rate limit for a user.
 * Throws ApiError(429) if limit exceeded.
 */
export async function checkAiRateLimit(userId) {
  const key = `ai:ratelimit:${userId}`;
  const max = parseInt(process.env.AI_RATE_LIMIT_MAX || "10");
  const window = parseInt(process.env.AI_RATE_LIMIT_WINDOW || "3600");

  const current = await redisClient.get(key);
  if (current && parseInt(current) >= max) {
    throw new ApiError(429, `AI rate limit exceeded. Max ${max} requests per hour.`);
  }

  const newCount = await redisClient.incr(key);
  if (newCount === 1) {
    await redisClient.expire(key, window);
  }

  return { remaining: max - newCount, limit: max };
}

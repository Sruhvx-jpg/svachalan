import Redis from "ioredis";
import "dotenv/config"

const url: string = process.env.REDIS_URL!

export const redis = new Redis(url, {
  maxRetriesPerRequest: null,
});

// Prevent unhandled error events from crashing the process
redis.on("error", (err) => {
  console.error("[Redis Error]", err.message);
});

redis.on("close", () => {
  console.warn("[Redis] Connection closed");
});

redis.on("reconnecting", () => {
  console.log("[Redis] Attempting to reconnect...");
});
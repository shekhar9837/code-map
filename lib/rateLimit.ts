import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(), // Use Upstash Redis from environment variables
    limiter: Ratelimit.slidingWindow(10, "10 h"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  });
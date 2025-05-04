import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
   limiter: Ratelimit.slidingWindow(5, "10 h"), analytics: true,
  prefix: "@upstash/ratelimit",
});

export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
   limiter: Ratelimit.slidingWindow(5, "1 m"), analytics: true,
  prefix: "@upstash/ratelimit",
});


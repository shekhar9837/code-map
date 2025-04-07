// lib/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import { NextApiRequest, NextApiResponse } from 'next';
import { promisify } from 'util';

// Create a wrapper for the rate limiter to use with Next.js
export function withRateLimit(handler: Function) {
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 2, // limit each IP to 5 requests per minute
    message: 'Too many requests from this IP, please try again later.',
    legacyHeaders: false,
    standardHeaders: true,
  });

  const promisifiedLimiter = promisify(limiter);

  return async (req: NextApiRequest, res: NextApiResponse) => {
    await promisifiedLimiter(req, res);
    return handler(req, res);
  };
}

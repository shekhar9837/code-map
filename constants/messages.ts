// Authentication related messages
export const AUTH = {
  ERROR: {
    TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
    AUTH_FAILED: 'Authentication failed',
    UNEXPECTED_ERROR: 'An unexpected error occurred',
  },
} as const;

// Rate limiting related messages
export const RATE_LIMIT = {
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
} as const;

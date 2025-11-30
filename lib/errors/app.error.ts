import { AUTH } from '@/constants/messages';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string = AUTH.ERROR.UNEXPECTED_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    Error.captureStackTrace(this);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = AUTH.ERROR.AUTH_FAILED, details?: unknown) {
    super(message, 401, true, details);
  }
}

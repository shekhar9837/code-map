import { z } from 'zod';
import { AppError } from '@/lib/errors/app.error';

export const validateRequest = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage?: string
): T => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new AppError(
      errorMessage || 'Validation failed',
      400,
      true,
      result.error.format()
    );
  }
  
  return result.data;
};

// Common validation schemas
export const authSchemas = {
  code: z.string().min(1, 'Authorization code is required'),
  next: z.string().default('/').transform(val => val.startsWith('/') ? val : `/${val}`),
};

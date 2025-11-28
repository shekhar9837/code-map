import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors/app.error';

type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  details?: unknown;
  success: boolean;
};

export const createApiResponse = <T = unknown>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse<ApiResponse<T>> => {
  return NextResponse.json(
    { data, success: true },
    { 
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
};

export const createApiError = (error: unknown): NextResponse<ApiResponse> => {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
        success: false,
      },
      { status: error.statusCode }
    );
  }

  const unknownError = new AppError('An unexpected error occurred');
  return NextResponse.json(
    {
      error: unknownError.message,
      success: false,
    },
    { status: 500 }
  );
};

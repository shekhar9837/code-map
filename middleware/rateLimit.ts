import { NextResponse } from 'next/server';
import { authRateLimit } from '@/lib/rateLimit';
import { RATE_LIMIT } from '@/constants/messages';

export const withRateLimit = async (
  request: Request,
  handler: (request: Request) => Promise<NextResponse>
) => {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const { success } = await authRateLimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: RATE_LIMIT.TOO_MANY_REQUESTS },
      { status: 429 }
    );
  }

  return handler(request);
};

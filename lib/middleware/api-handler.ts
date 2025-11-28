import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ratelimit } from '@/lib/rateLimit';
import { LoggerService } from '@/lib/services/logger.service';
import { AppError, AuthenticationError, RateLimitError } from '@/lib/errors/app.error';
// import { createApiError } from '@/lib/utils/api-response';
import { Database } from '@/lib/types/supabase';
import { createApiError } from '../utils/api-response';

type HandlerContext = {
  req: NextRequest;
  supabase: ReturnType<typeof createRouteHandlerClient<Database>>;
  user: { id: string };
  params: Record<string, string>;
};

type ApiHandler<T = unknown> = (context: HandlerContext) => Promise<NextResponse<T>>;

export function withApiHandler<T = unknown>(handler: ApiHandler<T>) {
  const logger = LoggerService.getLogger('ApiHandler');
  
  return async (req: NextRequest, { params = {} }: { params?: Record<string, string> } = {}) => {
    try {
      // Rate limiting
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const { success } = await ratelimit.limit(ip);
      
      if (!success) {
        logger.warn('Rate limit exceeded', { ip });
        throw new RateLimitError();
      }

      // Authentication
      const supabase = createRouteHandlerClient<Database>({ cookies });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new AuthenticationError();
      }

      // Call the actual handler
      return await handler({ 
        req, 
        supabase, 
        user: { id: user.id }, 
        params: params || {} 
      });
      
    } catch (error) {
      logger.error('API error', error);
      return createApiError(error);
    }
  };
}

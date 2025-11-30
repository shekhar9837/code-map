import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { LoggerService } from '@/lib/services/logger.service';
import { AppError, AuthenticationError } from '@/lib/errors/app.error';
// import { createApiError } from '@/lib/utils/api-response';
import { Database } from '@/lib/types/supabase';
import { createApiError } from '../utils/api-response';
import { SupabaseClient } from '@supabase/supabase-js';

type HandlerContext = {
  req: NextRequest;
  supabase: SupabaseClient<Database>;
  user: { id: string };
  params: Record<string, string>;
};

type ApiHandler<T = unknown> = (context: HandlerContext) => Promise<NextResponse<T>>;

export function withApiHandler<T = unknown>(handler: ApiHandler<T>) {
  const logger = LoggerService.getLogger('ApiHandler');
  
  return async (req: NextRequest, { params = {} }: { params?: Record<string, string> } = {}) => {
    try {
      // Authentication
      const supabase = await createClient();
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

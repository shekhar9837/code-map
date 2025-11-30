import { createClient } from '@/utils/supabase/server';
import { APP_URL } from '@/constants/urls';

export class AuthService {
  private static instance: AuthService;
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async handleOAuthCallback(code: string, next: string = '/') {
    const supabase = await createClient();

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth error:', error);
        throw new Error(error.message);
      }

      return `${APP_URL}${next}`;
    } catch (error) {
      console.error('OAuth error:', error);
      throw error;
    }
  }
}

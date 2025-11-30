import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { getLoginUrl } from '@/constants/urls';
import { AUTH } from '@/constants/messages';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  try {
    if (!code) {
      return NextResponse.redirect(getLoginUrl(AUTH.ERROR.AUTH_FAILED));
    }

    const authService = AuthService.getInstance();
    const redirectUrl = await authService.handleOAuthCallback(code, next);
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Auth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : AUTH.ERROR.UNEXPECTED_ERROR;
    return NextResponse.redirect(getLoginUrl(errorMessage));
  }
}
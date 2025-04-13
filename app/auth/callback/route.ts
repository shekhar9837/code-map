import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      // Handle authentication error
      console.error('Auth error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    // Get the current origin
    const origin = requestUrl.origin
    // Check if we're behind a proxy (in production)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const baseUrl = forwardedHost ? `https://${forwardedHost}` : origin

    return NextResponse.redirect(`${baseUrl}${next}`)
  }

  // If no code is present, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
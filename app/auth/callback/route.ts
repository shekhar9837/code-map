import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ratelimit } from '@/lib/rateLimit'

export async function GET(request: Request) {
  // Apply rate limiting
  const identifier = request.headers.get('x-real-ip') || 'api'
  const { success } = await ratelimit.limit(identifier)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`)
      }

      // Get the production URL from headers or fallback to request origin
      const host = request.headers.get('host') || ''
      const protocol = host.includes('localhost') ? 'http' : 'https'
      const baseUrl = `${protocol}://${host}`

      return NextResponse.redirect(`${baseUrl}${next}`)
    } catch (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
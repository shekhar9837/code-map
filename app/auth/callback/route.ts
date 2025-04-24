import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ratelimit } from '@/lib/rateLimit'

export async function GET(request: Request) {
  try {
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
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('Auth error:', error)
          return NextResponse.redirect(`https://codemap.shekharcodes.tech/login?error=${encodeURIComponent(error.message)}`)
        }

        // Always redirect to the production URL
        return NextResponse.redirect(`https://codemap.shekharcodes.tech${next}`)
      } catch (error) {
        console.error('OAuth error:', error)
        return NextResponse.redirect(`https://codemap.shekharcodes.tech/login?error=${encodeURIComponent('Authentication failed')}`)
      }
    }

    return NextResponse.redirect('https://codemap.shekharcodes.tech/login')
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect('https://codemap.shekharcodes.tech/login?error=unexpected_error')
  }
}
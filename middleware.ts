import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Redirect to dashboard if user is already logged in and tries to access login/signup
  if (['/login', '/signup'].includes(req.nextUrl.pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

// export const config = {
//   matcher: ['/dashboard/:path*', '/login', '/signup']
// }
export const config = {
  matcher: ['/login', '/signup']
}
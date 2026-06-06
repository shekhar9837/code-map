import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

// Cloudflare supports Edge middleware, but not Next.js Node proxy middleware.
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next({ request })
  }

  if (pathname === '/' || pathname === '') {
    try {
      const response = await updateSession(request)
      return response || NextResponse.next({ request })
    } catch {
      return NextResponse.next({ request })
    }
  }

  try {
    const response = await updateSession(request)
    return response || NextResponse.next({ request })
  } catch (error) {
    console.error('Middleware execution error:', {
      message: error instanceof Error ? error.message : String(error),
      path: pathname,
    })
    return NextResponse.next({ request })
  }
}

export const config = {
  unstable_allowDynamic: [
    '**/node_modules/@supabase/**',
    '**/node_modules/function-bind/**',
    '**/node_modules/has/**',
    '**/node_modules/has-symbols/**',
  ],
}

import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

// Next.js 16: Middleware is now called Proxy
// This function runs before a request is completed and can modify the response
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip proxy for API routes and Next.js internal routes
  // This is more efficient than running on every request
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next({ request })
  }
  
  // Early return for root path to ensure it's always accessible
  if (pathname === '/' || pathname === '') {
    try {
      const response = await updateSession(request)
      return response || NextResponse.next({ request })
    } catch (error) {
      // Even if Supabase fails, allow root path to load
      return NextResponse.next({ request })
    }
  }
  
  try {
    const response = await updateSession(request)
    return response || NextResponse.next({ request })
  } catch (error) {
    console.error('Proxy execution error:', {
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


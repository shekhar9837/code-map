import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

// Next.js 16: Middleware is now called Proxy
// This function runs before a request is completed and can modify the response
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Early return for root path to ensure it's always accessible
  // This prevents 404 errors on Vercel
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
    // Always ensure we return a response to prevent proxy invocation errors
    const response = await updateSession(request)
    
    // Ensure we always return a valid NextResponse
    if (!response) {
      return NextResponse.next({ request })
    }
    
    return response
  } catch (error) {
    // Fallback response if proxy fails completely
    // This prevents "middleware invocation" errors on Vercel
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Proxy execution error:', {
      message: errorMessage,
      stack: errorStack,
      path: request.nextUrl.pathname,
    })
    
    // Always return a proper response to prevent proxy invocation failure
    // This is critical for Vercel deployment
    return NextResponse.next({ request })
  }
}

export const config = {
  // Simplified matcher: exclude only essential Next.js internal routes
  // This matches all routes except API routes and static files
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
  // REQUIRED: Supabase SSR uses dynamic code that needs explicit permission in Edge runtime
  // Without this, you'll get "EvalError: Code generation from strings disallowed"
  unstable_allowDynamic: [
    '**/node_modules/@supabase/**',
    '**/node_modules/function-bind/**',
    '**/node_modules/has/**',
    '**/node_modules/has-symbols/**',
  ],
}


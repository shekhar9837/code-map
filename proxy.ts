import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

// Next.js 16: Middleware is now called Proxy
// This function runs before a request is completed and can modify the response
export async function proxy(request: NextRequest) {
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Static assets (images, fonts, etc.)
     * 
     * Also exclude prefetch requests to optimize performance
     * 
     * Note: The pattern uses .*? to allow zero or more characters, ensuring root path / matches
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot|ico)$).*)?',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
  unstable_allowDynamic: [
    // Allow dynamic code from @supabase/ssr and related dependencies
    // This is required for Edge Runtime compatibility
    '**/node_modules/@supabase/**',
    '**/node_modules/function-bind/**',
    '**/node_modules/has/**',
    '**/node_modules/has-symbols/**',
  ],
}


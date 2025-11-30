import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    // Check if environment variables are set
    // In Edge runtime, use process.env directly (works in Vercel)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      })
      // Return response without breaking the request
      return NextResponse.next({ request })
    }

    // Create response object that will be updated with cookies
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Update request cookies
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
            })
            // Create new response with updated cookies
            response = NextResponse.next({ request })
            // Set cookies on response
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // IMPORTANT: Use getSession() for automatic session refresh
    // This is the recommended pattern for Next.js 16 proxy/middleware
    // getSession() automatically refreshes expired sessions
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // If session error, log but continue (let app handle auth)
    if (sessionError) {
      console.error('Error getting session:', {
        message: sessionError.message,
        path: request.nextUrl.pathname,
      })
      return response
    }

    const user = session?.user ?? null


    // Define public paths that don't require authentication
    const pathname = request.nextUrl.pathname
    const publicPaths = ['/', '/login', '/signup']
    const isPublicPath = publicPaths.includes(pathname) || 
                         pathname === '' || // Handle empty pathname as root
                         pathname.startsWith('/auth')

    // Only redirect to login if user is not authenticated and trying to access a protected path
    if (!user && !isPublicPath) {
      // Create redirect URL preserving the original URL for post-login redirect
      // Use request.url as base to ensure proper domain/host handling on Vercel
      const loginUrl = new URL('/login', request.url)
      // Preserve the original path for redirect after login
      if (pathname && pathname !== '/') {
        loginUrl.searchParams.set('redirectTo', pathname)
      }
      // Return redirect response - this prevents "not found" errors
      return NextResponse.redirect(loginUrl)
    }

    // IMPORTANT: You *must* return the response object as it is.
    // This response contains the updated cookies from the session refresh.
    // The response object is automatically updated by setAll() when cookies change.
    // If you need to modify the response, make sure to copy cookies:
    //    myNewResponse.cookies.setAll(response.cookies.getAll())
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return response
  } catch (error) {
    // Catch any unexpected errors and log them
    // This prevents the proxy from crashing and causing 500 errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Proxy session update error:', {
      message: errorMessage,
      stack: errorStack,
      path: request.nextUrl.pathname,
    })
    
    // Return a response to prevent the proxy from crashing
    // The app will continue to function, but auth features may not work
    return NextResponse.next({ request })
  }
}
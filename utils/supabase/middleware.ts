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

    let supabaseResponse = NextResponse.next({ request })

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
            supabaseResponse = NextResponse.next({ request })
            // Set cookies on response
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    // This call refreshes the session if needed


    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      // Log error but don't fail the request
      console.error('Error getting user:', {
        message: error.message,
        status: error.status,
        path: request.nextUrl.pathname,
      })
      // Continue without authentication check - let the app handle it
      // Return the response to allow the request to proceed
      return supabaseResponse
    }

    // Define public paths that don't require authentication
    const pathname = request.nextUrl.pathname
    const publicPaths = ['/', '/login', '/signup']
    const isPublicPath = publicPaths.includes(pathname) || 
                         pathname === '' || // Handle empty pathname as root
                         pathname.startsWith('/auth')

    // Only redirect to login if user is not authenticated and trying to access a protected path
    if (!user && !isPublicPath) {
      // Create redirect URL preserving the original URL for post-login redirect
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      // Optionally preserve the original path for redirect after login
      if (pathname !== '/') {
        url.searchParams.set('redirectTo', pathname)
      }
      return NextResponse.redirect(url)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // This response contains the updated cookies from the session refresh.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse
  } catch (error) {
    // Catch any unexpected errors and log them
    // This prevents the middleware from crashing and causing 500 errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Middleware session update error:', {
      message: errorMessage,
      stack: errorStack,
      path: request.nextUrl.pathname,
    })
    
    // Return a response to prevent the middleware from crashing
    // The app will continue to function, but auth features may not work
    return NextResponse.next({ request })
  }
}
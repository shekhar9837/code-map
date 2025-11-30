import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.next({
        request,
      })
    }

    let supabaseResponse = NextResponse.next({
      request,
    })

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
            supabaseResponse = NextResponse.next({
              request,
            })
            // Set cookies on response
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )


    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()


    if (error) {
      console.error('Error getting user:', error.message)
      // Continue without authentication check - let the app handle it
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

    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next({
      request,
    })
  }
}
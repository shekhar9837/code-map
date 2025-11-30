import { NextRequest, NextResponse } from 'next/server'

// Ensure this route runs in Node.js runtime (not Edge)
export const runtime = 'nodejs'
// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic'

interface RefreshTokenRequest {
  refresh_token?: string
}

interface SupabaseTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user?: unknown
}

export async function POST(request: NextRequest) {
  // Determine if we're in production (for error messages)
  const isProduction = process.env.NODE_ENV === 'production'
  
  try {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      console.error('[Refresh Route] Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      return NextResponse.json(
        { error: 'Server configuration error: Supabase URL not set' },
        { status: 500 }
      )
    }

    if (!serviceRoleKey) {
      console.error('[Refresh Route] Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
      return NextResponse.json(
        { error: 'Server configuration error: Service role key not set' },
        { status: 500 }
      )
    }

    // Extract refresh token from cookie or request body
    let refreshToken: string | null = null

    // Try to get from cookie first
    const cookieToken = request.cookies.get('sb-refresh-token')?.value
    if (cookieToken) {
      refreshToken = cookieToken
      console.log('[Refresh Route] Found refresh token in cookie')
    } else {
      // Try to get from request body
      try {
        const body: RefreshTokenRequest = await request.json()
        if (body.refresh_token) {
          refreshToken = body.refresh_token
          console.log('[Refresh Route] Found refresh token in request body')
        }
      } catch (parseError) {
        // Body might be empty or invalid JSON, that's okay
        console.log('[Refresh Route] No valid JSON body found, checking cookie only')
      }
    }

    if (!refreshToken) {
      console.error('[Refresh Route] No refresh token provided in cookie or body')
      return NextResponse.json(
        { error: 'Refresh token is required. Provide it in cookie "sb-refresh-token" or request body { refresh_token }' },
        { status: 400 }
      )
    }

    // Call Supabase token endpoint
    const tokenEndpoint = `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`
    
    console.log('[Refresh Route] Calling Supabase token endpoint:', {
      endpoint: tokenEndpoint.replace(serviceRoleKey, '[REDACTED]'),
      hasRefreshToken: !!refreshToken,
    })

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('[Refresh Route] Supabase token endpoint error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData,
      })
      
      return NextResponse.json(
        { 
          error: responseData.error_description || responseData.error || 'Failed to refresh token',
          details: responseData 
        },
        { status: response.status }
      )
    }

    // Validate response structure
    const tokenData = responseData as SupabaseTokenResponse
    
    if (!tokenData.access_token || !tokenData.refresh_token) {
      console.error('[Refresh Route] Invalid token response structure:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
      })
      return NextResponse.json(
        { error: 'Invalid token response from Supabase' },
        { status: 500 }
      )
    }

    // Calculate cookie expiration times
    // expires_in is typically in seconds
    const accessTokenMaxAge = tokenData.expires_in || 3600 // Default to 1 hour if not provided
    const refreshTokenMaxAge = 30 * 24 * 60 * 60 // 30 days in seconds

    // Create response with session data
    const jsonResponse = NextResponse.json(
      { session: responseData },
      { status: 200 }
    )

    // Set httpOnly cookies
    jsonResponse.cookies.set('sb-access-token', tokenData.access_token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: isProduction,
      maxAge: accessTokenMaxAge,
    })

    jsonResponse.cookies.set('sb-refresh-token', tokenData.refresh_token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: isProduction,
      maxAge: refreshTokenMaxAge,
    })

    console.log('[Refresh Route] Successfully refreshed session:', {
      expiresIn: accessTokenMaxAge,
      isProduction,
    })

    return jsonResponse

  } catch (error) {
    // Log detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('[Refresh Route] Unexpected error:', {
      message: errorMessage,
      stack: errorStack,
    })

    return NextResponse.json(
      { 
        error: 'Internal server error while refreshing token',
        message: isProduction ? 'An error occurred' : errorMessage 
      },
      { status: 500 }
    )
  }
}


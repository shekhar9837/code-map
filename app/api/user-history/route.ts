import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    // console.log('Session:', session) // Debug log for session

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    // Get URL parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const start = (page - 1) * limit

    // Fetch user history with count
    const { data: history, error: historyError, count } = await supabase
      .from('roadmap_history')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id) // Ensure this matches the correct user_id
      .order('created_at', { ascending: false })
      .range(start, start + limit - 1)

    // console.log('Query user_id:', session.user.id) // Debug log for user_id
    // console.log('History:', history) // Debug log for history

    if (historyError) {
      console.error('History fetch error:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch user history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      history,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error) // Log unexpected errors
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
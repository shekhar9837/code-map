import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    if (!params?.id) {
        return NextResponse.json(
            { error: 'Missing ID parameter' },
            { status: 400 }
        )
    }

    const id = params.id
    console.log('Received ID:', id)
    try {
        const cookieStore = cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

        // Get the current session to verify authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        // console.log('Session:', session) // Debug log for session

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 401 }
            )
        }

        // Fetch user history with count
        const { data: history, error: historyError } = await supabase
            .from('roadmap_history')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('id', id)


        console.log('Query user_id:', session.user.id) // Debug log for user_id
        console.log('Query id:', id) // Debug log for id
        console.log('History:', history) // Debug log for history

        if (historyError) {
            console.error('History fetch error:', historyError);
            return NextResponse.json(
                { error: 'Failed to fetch user history' },
                { status: 500 }
            )
        }

        if (!history || history.length === 0) {
            console.warn('No history found for user:', session.user.id, 'with id:', id);
            return NextResponse.json(
                { error: 'No history found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            history: structuredClone(history)
        })



    } catch (error) {
        console.error('Unexpected error:', error instanceof Error ? error.message : error) // Log unexpected errors
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
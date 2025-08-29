import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron job or authorized source
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Call the cleanup function
    const { data, error } = await supabase.rpc('cleanup_non_article_tweets')

    if (error) {
      console.error('Error during tweets cleanup:', error)
      return NextResponse.json(
        { error: 'Failed to cleanup tweets', details: error.message },
        { status: 500 }
      )
    }

    const deletedCount = data || 0

    console.log(`Tweets cleanup completed. Deleted ${deletedCount} non-article tweets.`)

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount} non-article tweets older than 48 hours`,
      deletedCount
    })

  } catch (error) {
    console.error('Unexpected error during tweets cleanup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method for manual testing (only in development)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'GET method only available in development' },
      { status: 403 }
    )
  }

  // For development, allow GET requests without auth
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc('cleanup_non_article_tweets')

    if (error) {
      console.error('Error during tweets cleanup:', error)
      return NextResponse.json(
        { error: 'Failed to cleanup tweets', details: error.message },
        { status: 500 }
      )
    }

    const deletedCount = data || 0

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount} non-article tweets older than 48 hours`,
      deletedCount
    })

  } catch (error) {
    console.error('Unexpected error during tweets cleanup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { createServiceClient } from '@/lib/supabase/service'
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

    const supabase = createServiceClient()

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
      message: `Successfully deleted ${deletedCount} non-article tweets`,
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

// GET method for Vercel Cron jobs and manual testing
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security when called via HTTP
    const authHeader = request.headers.get('authorization')
    const querySecret = request.nextUrl.searchParams.get('secret')
    
    if ((!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== process.env.CRON_SECRET) && 
        querySecret !== process.env.CRON_SECRET) {
      console.error('Unauthorized access attempt to cleanup-tweets API')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

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
      message: `Successfully deleted ${deletedCount} non-article tweets`,
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
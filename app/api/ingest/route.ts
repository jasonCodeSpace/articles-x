export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createTwitterClient, TwitterTweet } from '@/lib/twitter'
import { ingestTweetsFromLists } from '@/lib/ingest'
import { getActiveTwitterListIds } from '@/lib/twitter-lists'

interface IngestRequest {
  dryRun?: boolean
  listIds?: string[]
}

interface IngestResponse {
  success: boolean
  message: string
  stats: {
    inserted: number
    updated: number
    skipped: number
    totalTweetsProcessed: number
    totalListsProcessed: number
    lists: Array<{
      listId: string
      tweetsFound: number
      articlesHarvested: number
      errors: string[]
    }>
  }
  dryRun: boolean
  processingTimeMs: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Validate cron secret
    const cronSecret = request.headers.get('x-cron-secret')
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Invalid cron secret' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const dryRun = searchParams.get('dryRun') === '1'

    // Parse request body (optional)
    let requestBody: IngestRequest = {}
    try {
      const body = await request.text()
      if (body) {
        requestBody = JSON.parse(body)
      }
    } catch (error) {
      console.warn('Failed to parse request body:', error)
    }

    console.log('🚀 Starting ingest process...', {
      dryRun,
      customListIds: requestBody.listIds?.length || 0
    })

    // Get list IDs from request body, environment, or database (in order of preference)
    let twitterListIds = requestBody.listIds

    if (!twitterListIds || twitterListIds.length === 0) {
      // Try environment variable as fallback
      const envListIds = process.env.TWITTER_LIST_IDS?.split(',').map(id => id.trim()).filter(Boolean)
      if (envListIds && envListIds.length > 0) {
        twitterListIds = envListIds
      } else {
        // Get all active Twitter lists from database
        try {
          twitterListIds = await getActiveTwitterListIds()
          console.log(`📋 Retrieved ${twitterListIds.length} active Twitter lists from database`)
        } catch (error) {
          console.error('Error fetching active Twitter lists from database:', error)
          return NextResponse.json(
            { 
              success: false, 
              message: 'Failed to fetch active Twitter lists from database. Ensure database is properly configured.' 
            },
            { status: 500 }
          )
        }
      }
    }

    if (!twitterListIds || twitterListIds.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No active Twitter lists found. Please add Twitter lists to the database or provide listIds in request body.' 
        },
        { status: 400 }
      )
    }

    console.log(`📋 Processing ${twitterListIds.length} Twitter lists:`, twitterListIds)

    // Create Twitter client
    const twitterClient = createTwitterClient()
    const listTweets = new Map<string, TwitterTweet[]>()
    let totalTweetsFound = 0

    // Fetch tweets from each list
    for (const listId of twitterListIds) {
      try {
        console.log(`🐦 Fetching tweets from list: ${listId}`)
        const tweets = await twitterClient.fetchAllListPages(listId)
        
        listTweets.set(listId, tweets)
        totalTweetsFound += tweets.length
        
        console.log(`✅ List ${listId}: Found ${tweets.length} tweets`)
        
        // Small delay between lists to be respectful to the API
        await sleep(2000)
        
      } catch (error) {
        console.error(`❌ Error fetching list ${listId}:`, error)
        
        // Add empty array for this list so it appears in stats
        listTweets.set(listId, [])
      }
    }

    console.log(`📊 Total tweets collected: ${totalTweetsFound} from ${listTweets.size} lists`)

    // Process tweets and ingest articles
    const ingestStats = await ingestTweetsFromLists(listTweets, dryRun)

    const processingTimeMs = Date.now() - startTime
    
    const response: IngestResponse = {
      success: true,
      message: dryRun 
        ? `Dry run completed successfully in ${processingTimeMs}ms` 
        : `Ingest completed successfully in ${processingTimeMs}ms`,
      stats: {
        inserted: ingestStats.inserted,
        updated: ingestStats.updated,
        skipped: ingestStats.skipped,
        totalTweetsProcessed: totalTweetsFound,
        totalListsProcessed: twitterListIds.length,
        lists: ingestStats.lists,
      },
      dryRun,
      processingTimeMs,
    }

    // Log summary
    console.log('📈 Ingest Summary:', {
      dryRun,
      inserted: ingestStats.inserted,
      updated: ingestStats.updated,
      skipped: ingestStats.skipped,
      totalTweets: totalTweetsFound,
      processingTime: `${processingTimeMs}ms`,
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 Ingest process failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const processingTimeMs = Date.now() - startTime

    return NextResponse.json(
      {
        success: false,
        message: `Ingest failed: ${errorMessage}`,
        processingTimeMs,
        error: process.env.NODE_ENV === 'development' ? {
          name: error instanceof Error ? error.name : 'Unknown',
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        } : undefined,
      },
      { status: 500 }
    )
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
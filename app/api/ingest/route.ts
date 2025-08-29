export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createTwitterClient, TwitterTweet } from '@/lib/twitter'
import { ingestTweetsFromLists } from '@/lib/ingest'
import { getActiveTwitterListIds } from '@/lib/twitter-lists'

interface IngestRequest {
  dryRun?: boolean
  listIds?: string[]
  maxLists?: number
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

function isAuthorized(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const byQuery = req.nextUrl.searchParams.get('secret')
  const byHeader = req.headers.get('x-cron-secret')
  return !!expected && (byQuery === expected || byHeader === expected)
}

async function runIngest(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const dryRun = searchParams.get('dryRun') === '1'

    // Parse request body (optional for POST)
    let requestBody: IngestRequest = {}
    if (request.method === 'POST') {
      try {
        const body = await request.text()
        if (body) {
          requestBody = JSON.parse(body)
        }
      } catch (error) {
        console.warn('Failed to parse request body:', error)
      }
    }

    console.log('🚀 Starting ingest process...', {
      method: request.method,
      dryRun,
      customListIds: requestBody.listIds?.length || 0
    })

    // Get list IDs from request body, environment variables, or database (in order of preference)
    let twitterListIds = requestBody.listIds

    if (!twitterListIds || twitterListIds.length === 0) {
      // Try to get from environment variables
      const envListIds = process.env.TWITTER_LIST_IDS
      if (envListIds) {
        twitterListIds = envListIds.split(',').map(id => id.trim()).filter(Boolean)
        console.log(`📋 Retrieved ${twitterListIds.length} Twitter lists from environment variables`)
      }
    }

    if (!twitterListIds || twitterListIds.length === 0) {
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

    // Limit number of lists for performance (configurable via query param)
    const maxLists = requestBody?.maxLists || parseInt(searchParams.get('maxLists') || '10')
    if (twitterListIds && twitterListIds.length > maxLists) {
      console.log(`Limiting to first ${maxLists} lists for performance`)
      twitterListIds = twitterListIds.slice(0, maxLists)
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

    // Fetch tweets from each list (limited to 2 pages per list for performance)
    for (const listId of twitterListIds) {
      try {
        console.log(`🐦 Fetching tweets from list: ${listId}`)
        const tweets = await twitterClient.fetchAllListPages(listId, 2)
        
        listTweets.set(listId, tweets)
        totalTweetsFound += tweets.length
        
        console.log(`✅ List ${listId}: Found ${tweets.length} tweets`)
        
        // Small delay between lists to be respectful to the API
        await sleep(1000)
        
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
      method: request.method,
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

// GET method for Vercel Cron and manual testing
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: Invalid secret' },
      { status: 401 }
    )
  }
  
  return runIngest(request)
}

// POST method for programmatic calls
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: Invalid secret' },
      { status: 401 }
    )
  }
  
  return runIngest(request)
}

// Disallow other HTTP methods
export async function PUT() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET or POST.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET or POST.' },
    { status: 405 }
  )
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
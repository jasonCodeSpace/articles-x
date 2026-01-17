import { NextRequest, NextResponse } from 'next/server'
import { notifyIndexNowBatch, getArticleUrl } from '@/lib/indexnow'

/**
 * IndexNow Notification API
 *
 * POST /api/indexnow/notify
 * Body: { url: string } or { urls: string[] }
 *
 * This endpoint can be called when:
 * - A new article is published
 * - An article is updated
 * - Multiple articles are published at once
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface NotifyRequest {
  url?: string
  urls?: string[]
  slug?: string
  slugs?: string[]
}

interface NotifyResponse {
  success: boolean
  results: Array<{
    engine: string
    success: boolean
    error?: string
  }>
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const body: NotifyRequest = await request.json()

    // Determine URLs to notify
    let urls: string[] = []

    if (body.url) {
      urls = [body.url]
    } else if (body.urls) {
      urls = body.urls
    } else if (body.slug) {
      urls = [getArticleUrl(body.slug)]
    } else if (body.slugs) {
      urls = body.slugs.map(getArticleUrl)
    } else {
      return NextResponse.json(
        {
          success: false,
          results: [],
          message: 'Please provide url, urls, slug, or slugs in the request body.',
        } satisfies NotifyResponse,
        { status: 400 }
      )
    }

    // Limit batch size to 10,000 (IndexNow limit)
    if (urls.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          results: [],
          message: 'Cannot notify more than 10,000 URLs at once.',
        } satisfies NotifyResponse,
        { status: 400 }
      )
    }

    // Call IndexNow API
    const results = await notifyIndexNowBatch(urls)

    // Check if all notifications succeeded
    const allSuccess = results.every((r) => r.success)

    return NextResponse.json({
      success: allSuccess,
      results: results.map((r) => ({
        engine: r.engine,
        success: r.success,
        error: r.error,
      })),
      message: allSuccess
        ? `Successfully notified search engines about ${urls.length} URL(s).`
        : `Partial success. Check results for details.`,
    } satisfies NotifyResponse)
  } catch (error) {
    console.error('[IndexNow API] Error:', error)

    return NextResponse.json(
      {
        success: false,
        results: [],
        message: 'Internal server error.',
      } satisfies NotifyResponse,
      { status: 500 }
    )
  }
}

// GET endpoint for testing/status
export async function GET() {
  const configured = process.env.INDEXNOW_KEY && process.env.INDEXNOW_KEY !== 'xarticle_news_key'

  return NextResponse.json({
    configured,
    key: process.env.INDEXNOW_KEY || 'xarticle_news_key',
    message: configured
      ? 'IndexNow is configured. Use POST to notify search engines.'
      : 'IndexNow is using default key. Set INDEXNOW_KEY in .env for production.',
  })
}

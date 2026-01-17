import { NextResponse } from 'next/server'

/**
 * IndexNow Key Verification Route
 *
 * Search engines will request this file to verify ownership of the domain.
 * The URL format is: https://www.xarticle.news/{key}.txt
 * The file should contain only the key value.
 *
 * Route: /[key]/indexnow.txt
 * Example: https://www.xarticle.news/xarticle_news_key/indexnow.txt
 */

// Cache the key file for a long time (it rarely changes)
export const dynamic = 'error' // Static file

interface RouteContext {
  params: Promise<{ key: string }>
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  const { key } = await context.params
  const indexNowKey = process.env.INDEXNOW_KEY || 'xarticle_news_key'

  // Verify the requested key matches our configured key
  if (key !== indexNowKey) {
    return new NextResponse('Key not found', { status: 404 })
  }

  // Return the key as plain text (required by IndexNow)
  return new NextResponse(indexNowKey, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 1 day
    },
  })
}

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

function authorized(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const byQuery = req.nextUrl.searchParams.get('secret')
  const byHeader = req.headers.get('authorization')?.replace('Bearer ', '') // 支持两种方式
  return !!expected && (byQuery === expected || byHeader === expected)
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is coming from Vercel Cron (支持查询参数或Authorization头)
    if (!authorized(request)) {
      console.error('❌ Unauthorized cron request - invalid secret')
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    console.log('🕐 Vercel Cron triggered - starting scheduled ingest of all Twitter lists')

    // Get the base URL for internal API call
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host')
    
    if (!host) {
      return NextResponse.json({
        success: false,
        error: 'Unable to determine host for internal API call'
      }, { status: 500 })
    }

    const baseUrl = `${protocol}://${host}`
    const ingestUrl = `${baseUrl}/api/ingest`

    console.log(`📍 Making internal API call to: ${ingestUrl}`)

    // Call the ingest API internally
    const response = await fetch(ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || '',
      },
      body: JSON.stringify({}),
      // Longer timeout for processing all 26 lists
      signal: AbortSignal.timeout(600000) // 10 minutes
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ Internal ingest API call failed:', response.status, responseData)
      return NextResponse.json({
        success: false,
        error: `Ingest API failed: ${responseData.message || 'Unknown error'}`,
        details: responseData
      }, { status: response.status })
    }

    console.log('✅ Scheduled ingest completed successfully')
    console.log('📊 Stats:', JSON.stringify(responseData.stats, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Scheduled ingest completed via Vercel Cron',
      timestamp: new Date().toISOString(),
      stats: responseData.stats,
      processingTimeMs: responseData.processingTimeMs
    })

  } catch (error) {
    console.error('💥 Cron ingest failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({
      success: false,
      error: `Cron ingest failed: ${errorMessage}`,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  try {
    // Same authorization check for POST requests
    if (!authorized(request)) {
      console.error('❌ Unauthorized POST cron request - invalid secret')
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    // Call the GET handler for the actual logic
    return GET(request)
  } catch (error) {
    console.error('💥 POST cron request failed:', error)
    return NextResponse.json({
      success: false,
      error: 'POST request failed'
    }, { status: 500 })
  }
}
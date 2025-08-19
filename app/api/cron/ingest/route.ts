export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verify this is coming from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
  return GET(request)
}
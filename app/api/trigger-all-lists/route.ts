export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

interface TriggerResponse {
  success: boolean
  message: string
  redirected_to?: string
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get the base URL for the API call
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    
    if (!host) {
      return NextResponse.json({
        success: false,
        error: 'Unable to determine host for API call'
      }, { status: 500 })
    }

    const baseUrl = `${protocol}://${host}`
    
    // Parse query parameters for dry run
    const searchParams = request.nextUrl.searchParams
    const dryRun = searchParams.get('dryRun') === '1'
    
    // Get cron secret from environment
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json({
        success: false,
        error: 'CRON_SECRET environment variable not configured'
      }, { status: 500 })
    }

    // Build the ingest API URL
    const ingestUrl = new URL('/api/ingest', baseUrl)
    if (dryRun) {
      ingestUrl.searchParams.set('dryRun', '1')
    }

    console.log(`🚀 Triggering ingest for all active Twitter lists...`)
    console.log(`📍 Target URL: ${ingestUrl.toString()}`)
    
    // Make the API call to the ingest endpoint
    const response = await fetch(ingestUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret,
      },
      // Empty body - let ingest endpoint fetch from database
      body: JSON.stringify({})
    })

    const responseData = await response.json()
    
    if (!response.ok) {
      console.error('❌ Ingest API call failed:', response.status, responseData)
      return NextResponse.json({
        success: false,
        error: `Ingest API failed: ${responseData.message || 'Unknown error'}`,
        status_code: response.status
      }, { status: response.status })
    }

    console.log('✅ Successfully triggered ingest for all active Twitter lists')
    
    const result: TriggerResponse = {
      success: true,
      message: dryRun 
        ? 'Successfully triggered dry run for all active Twitter lists' 
        : 'Successfully triggered ingest for all active Twitter lists',
      redirected_to: ingestUrl.toString()
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('💥 Error triggering all lists:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({
      success: false,
      error: `Failed to trigger ingest: ${errorMessage}`
    }, { status: 500 })
  }
}

// GET method for easy testing
export async function GET(request: NextRequest) {
  // Redirect GET requests to POST for convenience
  return POST(request)
}

// Disallow other methods
export async function PUT() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed. Use POST.'
  }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed. Use POST.'
  }, { status: 405 })
}
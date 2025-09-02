import { NextRequest, NextResponse } from 'next/server'

// General cron endpoint for Vercel Cron jobs
export async function GET(request: NextRequest) {
  try {
    // Check authorization - Vercel automatically adds CRON_SECRET to Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the current time for logging
    const now = new Date().toISOString()
    
    console.log(`Cron job executed at ${now}`)
    
    return NextResponse.json({
      ok: true,
      message: 'Cron job executed successfully',
      timestamp: now
    })
    
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST method for compatibility
export async function POST(request: NextRequest) {
  return GET(request)
}
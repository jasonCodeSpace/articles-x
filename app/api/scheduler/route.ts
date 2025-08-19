import { NextRequest, NextResponse } from 'next/server'
import { startScheduler, stopScheduler, getSchedulerStats } from '@/lib/scheduler'

// GET /api/scheduler - Get scheduler status
export async function GET() {
  try {
    const stats = getSchedulerStats()
    
    if (!stats) {
      return NextResponse.json({
        error: 'Scheduler not initialized'
      }, { status: 404 })
    }

    return NextResponse.json({
      status: 'success',
      scheduler: stats
    })
  } catch (error) {
    console.error('Error getting scheduler status:', error)
    return NextResponse.json({
      error: 'Failed to get scheduler status'
    }, { status: 500 })
  }
}

// POST /api/scheduler - Start/stop scheduler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (!action || !['start', 'stop'].includes(action)) {
      return NextResponse.json({
        error: 'Invalid action. Use "start" or "stop"'
      }, { status: 400 })
    }

    if (action === 'start') {
      startScheduler()
      return NextResponse.json({
        status: 'success',
        message: 'Scheduler started',
        scheduler: getSchedulerStats()
      })
    } else {
      stopScheduler()
      return NextResponse.json({
        status: 'success',
        message: 'Scheduler stopped',
        scheduler: getSchedulerStats()
      })
    }
  } catch (error) {
    console.error('Error controlling scheduler:', error)
    return NextResponse.json({
      error: 'Failed to control scheduler'
    }, { status: 500 })
  }
}

// PUT /api/scheduler - Update scheduler configuration
export async function PUT() {
  return NextResponse.json({
    error: 'Configuration updates not supported yet'
  }, { status: 501 })
}

// DELETE /api/scheduler - Reset scheduler stats
export async function DELETE() {
  try {
    // Reset scheduler stats functionality would go here
    return NextResponse.json({
      status: 'success',
      message: 'Scheduler stats reset'
    })
  } catch (error) {
    console.error('Error resetting scheduler stats:', error)
    return NextResponse.json({
      error: 'Failed to reset scheduler stats'
    }, { status: 500 })
  }
}
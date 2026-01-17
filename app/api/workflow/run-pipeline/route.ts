import { NextRequest, NextResponse } from 'next/server'
import { runArticlePipeline } from '@/lib/workflow/workflows/article-pipeline'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runArticlePipeline()

    return NextResponse.json({
      success: result.status === 'completed',
      status: result.status,
      duration: Date.now() - result.startedAt.getTime(),
      logs: result.logs.map(l => ({
        timestamp: l.timestamp,
        level: l.level,
        step: l.step,
        message: l.message
      }))
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// GET for simplicity
export async function GET(request: NextRequest) {
  return POST(request)
}

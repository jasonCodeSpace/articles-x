/**
 * Cron Job Runner for Racknerd Server
 *
 * This script runs all scheduled tasks:
 * 1. Article Pipeline (fetch, extract, save, summarize)
 * 2. Daily Summary Generation
 *
 * Usage:
 *   tsx cron-runner.ts --job=pipeline       # Run article pipeline
 *   tsx cron-runner.ts --job=daily-report   # Run daily report
 *   tsx cron-runner.ts --job=all            # Run all jobs
 */

import { runArticlePipeline } from '../lib/workflow/workflows/article-pipeline'
import { runDailyReport } from '../lib/workflow/workflows/daily-report'

const JOBS = {
  pipeline: 'Article Pipeline - Fetch, extract, save, and summarize articles',
  'daily-report': 'Daily Report - Generate daily summary from past 24h articles',
  all: 'Run all jobs'
} as const

type JobName = keyof typeof JOBS

function parseArgs(): JobName {
  const args = process.argv.slice(2)
  const jobArg = args.find(arg => arg.startsWith('--job='))

  if (jobArg) {
    const jobName = jobArg.split('=')[1] as JobName
    if (jobName in JOBS) {
      return jobName
    }
    console.error(`❌ Unknown job: ${jobName}`)
    console.log(`Available jobs: ${Object.keys(JOBS).join(', ')}`)
    process.exit(1)
  }

  // Default to pipeline if no job specified
  return 'pipeline'
}

async function runJob(jobName: JobName): Promise<void> {
  const startTime = Date.now()
  console.log(`\n${'='.repeat(50)}`)
  console.log(`🚀 Starting job: ${JOBS[jobName]}`)
  console.log(`🕐 Started at: ${new Date().toISOString()}`)
  console.log(`${'='.repeat(50)}\n`)

  try {
    switch (jobName) {
      case 'pipeline':
        await runArticlePipeline()
        break

      case 'daily-report':
        await runDailyReport()
        break

      case 'all':
        console.log('\n📋 Running all jobs sequentially...\n')
        await runArticlePipeline()
        console.log('\n✅ Article pipeline completed!\n')
        await runDailyReport()
        break
    }

    const duration = Date.now() - startTime
    console.log(`\n${'='.repeat(50)}`)
    console.log(`✅ Job completed successfully in ${Math.floor(duration / 1000)}s`)
    console.log(`🕐 Finished at: ${new Date().toISOString()}`)
    console.log(`${'='.repeat(50)}\n`)

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`\n${'='.repeat(50)}`)
    console.error(`❌ Job failed after ${Math.floor(duration / 1000)}s`)
    console.error(`Error:`, error)
    console.error(`${'='.repeat(50)}\n`)
    process.exit(1)
  }
}

// Main execution
const jobName = parseArgs()
runJob(jobName)

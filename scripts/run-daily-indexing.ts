#!/usr/bin/env npx tsx
/**
 * Daily Indexing Runner
 * Updates which articles are indexed for trending page
 * Run this script via cron daily
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
import { runDailyIndexing } from '../lib/workflow/workflows/daily-indexing'

async function main() {
  try {
    const result = await runDailyIndexing(1, 5)

    if (result.status === 'failed') {
      console.error('Workflow failed:', result.error)
      process.exit(1)
    }

    console.log('Workflow completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()

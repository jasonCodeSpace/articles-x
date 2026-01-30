#!/usr/bin/env npx tsx
/**
 * Daily Quota Adjustment Runner
 * Runs at 23:50 daily to adjust indexed articles to 5-7
 * Promotes from archive if <5, demotes if >7
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
import { runDailyQuota } from '../lib/workflow/workflows/daily-quota'

async function main() {
  try {
    const result = await runDailyQuota(5, 7)

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

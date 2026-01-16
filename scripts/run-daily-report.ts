#!/usr/bin/env npx tsx
/**
 * 每日报告工作流运行脚本
 * 用于 cron 定时任务
 */
import 'dotenv/config'
import { runDailyReport } from '../lib/workflow/workflows/daily-report'

async function main() {
  try {
    const result = await runDailyReport()

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

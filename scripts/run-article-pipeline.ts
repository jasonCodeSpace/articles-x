#!/usr/bin/env npx tsx
/**
 * 文章处理工作流运行脚本
 * 用于 cron 定时任务
 */
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
import { runArticlePipeline } from '../lib/workflow/workflows/article-pipeline'

async function main() {
  try {
    const result = await runArticlePipeline()

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

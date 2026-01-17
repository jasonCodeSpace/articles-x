/**
 * Run Article Pipeline Script
 * 完整的文章处理流程
 */
const { runArticlePipeline } = require('../lib/workflow/workflows/article-pipeline')

async function main() {
  console.log('Starting Article Pipeline...\n')

  try {
    const result = await runArticlePipeline()

    console.log('\n========================================')
    console.log('Pipeline Result Summary')
    console.log('========================================')
    console.log(`Status: ${result.status}`)
    console.log(`Duration: ${Date.now() - result.startedAt.getTime()}ms`)
    console.log(`Steps completed: ${result.completedSteps}/${result.steps.length}`)

    if (result.logs && result.logs.length > 0) {
      console.log('\nLogs:')
      result.logs.forEach(log => {
        console.log(`  [${log.level.toUpperCase()}] ${log.step}: ${log.message}`)
      })
    }

    if (result.status === 'completed') {
      console.log('\n✅ Pipeline completed successfully!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Pipeline had issues')
      process.exit(1)
    }
  } catch (error) {
    console.error('Pipeline failed:', error)
    process.exit(1)
  }
}

main()

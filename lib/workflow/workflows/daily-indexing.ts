/**
 * Daily Indexing Workflow
 * Indexes new high-quality articles for search engines
 * - Only indexes articles that are NOT already indexed
 * - Does NOT unindex any previously indexed articles (preserves SEO history)
 * - Limited to maxDailyIndex articles per run to avoid spam detection
 */
import { runWorkflow, WorkflowDefinition, WorkflowStep } from '../engine'
import { updateDailyIndexingStep } from '../steps/update-daily-indexing'

export const dailyIndexingWorkflow: WorkflowDefinition = {
  name: 'daily-indexing',
  description: 'Index new high-quality articles for search engines (max 10/day)',
  steps: [updateDailyIndexingStep as WorkflowStep]
}

export async function runDailyIndexing(maxDailyIndex: number = 10, minScore: number = 65, lookbackDays: number = 7) {
  console.log('========================================')
  console.log('Starting Daily Indexing Workflow')
  console.log(`Max new articles: ${maxDailyIndex}, Min score: ${minScore}, Lookback: ${lookbackDays} days`)
  console.log('========================================')

  const result = await runWorkflow(dailyIndexingWorkflow, {
    maxDailyIndex,
    minScore,
    lookbackDays
  })

  console.log('========================================')
  console.log(`Workflow ${result.status}`)
  console.log(`Duration: ${Date.now() - result.startedAt.getTime()}ms`)
  const stepResult = result.data['update-daily-indexing'] as { newlyIndexed?: number } | undefined
  if (stepResult?.newlyIndexed) {
    console.log(`Newly indexed: ${stepResult.newlyIndexed} articles`)
  }
  console.log('========================================')

  return result
}

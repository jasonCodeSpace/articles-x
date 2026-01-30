/**
 * Global Top Indexing Workflow
 * Updates which articles are indexed for trending page
 * Selects global top 5 articles by score (all-time)
 */
import { runWorkflow, WorkflowDefinition, WorkflowStep } from '../engine'
import { updateDailyIndexingStep } from '../steps/update-daily-indexing'

export const dailyIndexingWorkflow: WorkflowDefinition = {
  name: 'daily-indexing',
  description: 'Update global top article indexing for trending page (top 5 all-time)',
  steps: [updateDailyIndexingStep as WorkflowStep]
}

export async function runDailyIndexing(topN: number = 5, minScore: number = 70) {
  console.log('========================================')
  console.log('Starting Global Top Indexing Workflow')
  console.log('========================================')

  const result = await runWorkflow(dailyIndexingWorkflow, {
    topN,
    minScore
  })

  console.log('========================================')
  console.log(`Workflow ${result.status}`)
  console.log(`Duration: ${Date.now() - result.startedAt.getTime()}ms`)
  console.log('========================================')

  return result
}

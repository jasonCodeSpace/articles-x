/**
 * Cleanup Low-Score Articles Workflow
 * Runs hourly to remove full content from articles with score < 65
 * Keeps only essential data: title, author, url, views, score
 */
import { runWorkflow, WorkflowDefinition, WorkflowStep } from '../engine'
import { cleanupLowScoreStep } from '../steps/cleanup-low-score-articles'

export const cleanupLowScoreWorkflow: WorkflowDefinition = {
  name: 'cleanup-low-score',
  description: 'Remove full content from articles with score < 65 (keeps title, author, url, views, score)',
  steps: [cleanupLowScoreStep as WorkflowStep]
}

export async function runCleanupLowScore(minScore: number = 65) {
  console.log('========================================')
  console.log('Starting Low-Score Article Cleanup')
  console.log('========================================')

  const result = await runWorkflow(cleanupLowScoreWorkflow, {
    minScore,
    dryRun: false
  })

  console.log('========================================')
  console.log(`Workflow ${result.status}`)
  console.log(`Duration: ${Date.now() - result.startedAt.getTime()}ms`)
  console.log('========================================')

  return result
}

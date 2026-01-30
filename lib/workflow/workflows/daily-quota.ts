/**
 * Daily Quota Adjustment Workflow
 * Runs at 23:50 daily to ensure 5-7 articles are indexed on trending
 * Promotes from archive if needed, demotes if too many
 */
import { runWorkflow, WorkflowDefinition, WorkflowStep } from '../engine'
import { dailyAdjustmentStep } from '../steps/daily-adjustment'

export const dailyQuotaWorkflow: WorkflowDefinition = {
  name: 'daily-quota',
  description: 'Adjust daily article quota (5-7 articles)',
  steps: [dailyAdjustmentStep as WorkflowStep]
}

export async function runDailyQuota(minArticles: number = 5, maxArticles: number = 7) {
  console.log('========================================')
  console.log('Starting Daily Quota Adjustment')
  console.log('========================================')

  const result = await runWorkflow(dailyQuotaWorkflow, {
    minArticles,
    maxArticles
  })

  console.log('========================================')
  console.log(`Workflow ${result.status}`)
  console.log(`Duration: ${Date.now() - result.startedAt.getTime()}ms`)
  console.log('========================================')

  return result
}

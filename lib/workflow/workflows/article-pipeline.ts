/**
 * 文章处理工作流 - 每15分钟运行
 *
 * 流程:
 * 1. 从 Twitter Lists 获取推文
 * 2. 提取文章
 * 3. 保存到 Supabase
 * 4. 生成 AI 摘要
 * 5. 保存摘要
 */
import { runWorkflow, WorkflowDefinition } from '../engine'
import { fetchListsStep } from '../steps/fetch-lists'
import { extractArticlesStep } from '../steps/extract-articles'
import { saveArticlesStep } from '../steps/save-articles'
import { generateSummariesStep } from '../steps/generate-summaries'
import { saveSummariesStep } from '../steps/save-summaries'

export const articlePipelineWorkflow: WorkflowDefinition = {
  name: 'article-pipeline',
  description: '从 Twitter 获取文章并生成摘要',
  steps: [
    fetchListsStep,
    extractArticlesStep,
    saveArticlesStep,
    generateSummariesStep,
    saveSummariesStep
  ]
}

export async function runArticlePipeline() {
  console.log('========================================')
  console.log('Starting Article Pipeline Workflow')
  console.log('========================================')

  const result = await runWorkflow(articlePipelineWorkflow)

  console.log('========================================')
  console.log(`Workflow ${result.status}`)
  console.log(`Duration: ${Date.now() - result.startedAt.getTime()}ms`)
  console.log('========================================')

  return result
}

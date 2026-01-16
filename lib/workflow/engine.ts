/**
 * Workflow Engine - 线性工作流引擎
 *
 * 特点:
 * - 步骤之间数据自动传递
 * - 任何步骤返回空数据，后续步骤自动跳过
 * - 详细日志记录
 * - 错误处理和重试
 */

export interface WorkflowContext {
  workflowId: string
  workflowName: string
  startedAt: Date
  data: Record<string, unknown>
  logs: WorkflowLog[]
  status: 'running' | 'completed' | 'failed' | 'skipped'
  error?: Error
}

export interface WorkflowLog {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  step?: string
  message: string
  data?: unknown
}

export interface StepResult<T = unknown> {
  success: boolean
  data?: T
  skip?: boolean  // 如果为 true，跳过后续步骤
  message?: string
  error?: Error
}

export type WorkflowStep<TInput = unknown, TOutput = unknown> = {
  name: string
  execute: (input: TInput, ctx: WorkflowContext) => Promise<StepResult<TOutput>>
  retries?: number
  retryDelay?: number  // ms
  optional?: boolean   // 如果为 true，失败不会中断工作流
}

export interface WorkflowDefinition {
  name: string
  description?: string
  steps: WorkflowStep[]
}

function generateWorkflowId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function log(ctx: WorkflowContext, level: WorkflowLog['level'], message: string, step?: string, data?: unknown) {
  const logEntry: WorkflowLog = {
    timestamp: new Date(),
    level,
    step,
    message,
    data
  }
  ctx.logs.push(logEntry)

  const prefix = step ? `[${ctx.workflowName}:${step}]` : `[${ctx.workflowName}]`
  const timestamp = logEntry.timestamp.toISOString()

  switch (level) {
    case 'error':
      console.error(`${timestamp} ${prefix} ${message}`, data || '')
      break
    case 'warn':
      console.warn(`${timestamp} ${prefix} ${message}`, data || '')
      break
    case 'debug':
      if (process.env.WORKFLOW_DEBUG === 'true') {
        console.log(`${timestamp} ${prefix} [DEBUG] ${message}`, data || '')
      }
      break
    default:
      console.log(`${timestamp} ${prefix} ${message}`, data || '')
  }
}

async function executeStepWithRetry<TInput, TOutput>(
  step: WorkflowStep<TInput, TOutput>,
  input: TInput,
  ctx: WorkflowContext
): Promise<StepResult<TOutput>> {
  const maxRetries = step.retries ?? 0
  const retryDelay = step.retryDelay ?? 1000

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        log(ctx, 'info', `Retry attempt ${attempt}/${maxRetries}`, step.name)
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }

      return await step.execute(input, ctx)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      log(ctx, 'warn', `Step failed: ${lastError.message}`, step.name)
    }
  }

  return {
    success: false,
    error: lastError,
    message: `Failed after ${maxRetries + 1} attempts`
  }
}

export async function runWorkflow(
  definition: WorkflowDefinition,
  initialData: Record<string, unknown> = {}
): Promise<WorkflowContext> {
  const ctx: WorkflowContext = {
    workflowId: generateWorkflowId(),
    workflowName: definition.name,
    startedAt: new Date(),
    data: { ...initialData },
    logs: [],
    status: 'running'
  }

  log(ctx, 'info', `Starting workflow: ${definition.name}`)
  log(ctx, 'debug', 'Initial data', undefined, initialData)

  let stepInput: unknown = initialData

  for (const step of definition.steps) {
    log(ctx, 'info', `Executing step: ${step.name}`, step.name)

    const result = await executeStepWithRetry(step, stepInput, ctx)

    if (!result.success) {
      if (step.optional) {
        log(ctx, 'warn', `Optional step failed, continuing: ${result.message}`, step.name)
        continue
      }

      log(ctx, 'error', `Step failed: ${result.message}`, step.name, result.error)
      ctx.status = 'failed'
      ctx.error = result.error
      break
    }

    if (result.skip) {
      log(ctx, 'info', `Workflow skipped: ${result.message || 'No data to process'}`, step.name)
      ctx.status = 'skipped'
      break
    }

    // 保存步骤结果到 context
    ctx.data[step.name] = result.data
    stepInput = result.data

    log(ctx, 'info', `Step completed: ${step.name}`, step.name)
    log(ctx, 'debug', 'Step output', step.name, result.data)
  }

  if (ctx.status === 'running') {
    ctx.status = 'completed'
  }

  const duration = Date.now() - ctx.startedAt.getTime()
  log(ctx, 'info', `Workflow ${ctx.status} in ${duration}ms`)

  return ctx
}

// 工具函数：创建步骤
export function createStep<TInput, TOutput>(
  name: string,
  execute: (input: TInput, ctx: WorkflowContext) => Promise<StepResult<TOutput>>,
  options?: Partial<Omit<WorkflowStep<TInput, TOutput>, 'name' | 'execute'>>
): WorkflowStep<TInput, TOutput> {
  return {
    name,
    execute,
    ...options
  }
}

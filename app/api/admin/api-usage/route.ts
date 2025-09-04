import { NextRequest, NextResponse } from 'next/server'
import { getApiUsageStats, resetApiCounters } from '@/lib/api-usage-tracker'
import { checkRateLimit, getClientId, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { createErrorResponse, handleApiError } from '@/lib/error-handler'
import { logApiRequest, logApiResponse } from '@/lib/api-logger'

/**
 * 检查管理员权限
 */
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    return false
  }
  
  return authHeader === `Bearer ${cronSecret}`
}

/**
 * GET /api/admin/api-usage
 * 获取 API 使用统计信息
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = logApiRequest(request)
  const clientId = getClientId(request)

  try {
    // 检查速率限制
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.authenticated)
    if (!rateLimitResult) {
      logApiResponse(requestId, 429, Date.now() - startTime, 'Rate limit exceeded')
      return createErrorResponse('RATE_LIMITED')
    }

    // 检查管理员权限
    if (!isAuthorized(request)) {
      logApiResponse(requestId, 401, Date.now() - startTime, 'Unauthorized access attempt')
      return createErrorResponse('UNAUTHORIZED')
    }

    // 获取 API 使用统计
    const stats = getApiUsageStats()
    
    logApiResponse(requestId, 200, Date.now() - startTime)

    return NextResponse.json({
      success: true,
      data: {
        rapidapi: {
          ...stats.rapidapi,
          resetTime: new Date(stats.rapidapi.resetTime).toISOString()
        },
        gemini: {
          ...stats.gemini,
          resetTime: new Date(stats.gemini.resetTime).toISOString()
        },
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logApiResponse(requestId, 500, Date.now() - startTime, 'Internal server error')
    return handleApiError(error, 'API usage stats retrieval')
  }
}

/**
 * POST /api/admin/api-usage
 * 重置 API 使用计数器（仅用于测试）
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = logApiRequest(request)
  const clientId = getClientId(request)

  try {
    // 检查速率限制
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.authenticated)
    if (!rateLimitResult) {
      logApiResponse(requestId, 429, Date.now() - startTime, 'Rate limit exceeded')
      return createErrorResponse('RATE_LIMITED')
    }

    // 检查管理员权限
    if (!isAuthorized(request)) {
      logApiResponse(requestId, 401, Date.now() - startTime, 'Unauthorized access attempt')
      return createErrorResponse('UNAUTHORIZED')
    }

    const body = await request.json()
    const { action } = body

    if (action !== 'reset') {
      logApiResponse(requestId, 400, Date.now() - startTime, 'Invalid action')
      return createErrorResponse('BAD_REQUEST', 'Invalid action. Only "reset" is supported.')
    }

    // 重置计数器
    resetApiCounters()
    
    const newStats = getApiUsageStats()
    
    logApiResponse(requestId, 200, Date.now() - startTime)

    return NextResponse.json({
      success: true,
      message: 'API usage counters reset successfully',
      data: {
        rapidapi: {
          ...newStats.rapidapi,
          resetTime: new Date(newStats.rapidapi.resetTime).toISOString()
        },
        gemini: {
          ...newStats.gemini,
          resetTime: new Date(newStats.gemini.resetTime).toISOString()
        },
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logApiResponse(requestId, 500, Date.now() - startTime, 'Internal server error')
    return handleApiError(error, 'API usage reset')
  }
}
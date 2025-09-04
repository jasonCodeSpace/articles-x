/**
 * API Usage Tracker
 * 管理 RapidAPI Twitter API 和 Gemini API 的每日调用次数限制
 */

interface ApiUsage {
  count: number
  date: string
  resetTime: number
}

interface ApiUsageStore {
  rapidapi: ApiUsage
  gemini: ApiUsage
}

// API 调用限制配置
export const API_LIMITS = {
  RAPIDAPI_DAILY_LIMIT: 1600,
  GEMINI_DAILY_LIMIT: 700,
} as const

// 内存存储（生产环境建议使用 Redis）
let apiUsageStore: ApiUsageStore = {
  rapidapi: { count: 0, date: getCurrentDateString(), resetTime: getNextResetTime() },
  gemini: { count: 0, date: getCurrentDateString(), resetTime: getNextResetTime() }
}

/**
 * 获取当前日期字符串 (YYYY-MM-DD)
 */
function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * 获取下一次重置时间（明天 00:00 UTC）
 */
function getNextResetTime(): number {
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  return tomorrow.getTime()
}

/**
 * 重置每日计数器
 */
function resetDailyCounters() {
  const currentDate = getCurrentDateString()
  const resetTime = getNextResetTime()
  
  if (apiUsageStore.rapidapi.date !== currentDate) {
    apiUsageStore.rapidapi = { count: 0, date: currentDate, resetTime }
  }
  
  if (apiUsageStore.gemini.date !== currentDate) {
    apiUsageStore.gemini = { count: 0, date: currentDate, resetTime }
  }
}

/**
 * 检查 API 调用是否超出限制
 */
export function checkApiLimit(apiType: 'rapidapi' | 'gemini'): {
  allowed: boolean
  currentCount: number
  limit: number
  resetTime: number
  message?: string
} {
  resetDailyCounters()
  
  const usage = apiUsageStore[apiType]
  const limit = apiType === 'rapidapi' ? API_LIMITS.RAPIDAPI_DAILY_LIMIT : API_LIMITS.GEMINI_DAILY_LIMIT
  
  const allowed = usage.count < limit
  
  return {
    allowed,
    currentCount: usage.count,
    limit,
    resetTime: usage.resetTime,
    message: allowed ? undefined : `Daily ${apiType.toUpperCase()} API limit (${limit}) exceeded. Resets at ${new Date(usage.resetTime).toISOString()}`
  }
}

/**
 * 记录 API 调用
 */
export function recordApiCall(apiType: 'rapidapi' | 'gemini'): {
  success: boolean
  currentCount: number
  limit: number
  remaining: number
} {
  resetDailyCounters()
  
  const usage = apiUsageStore[apiType]
  const limit = apiType === 'rapidapi' ? API_LIMITS.RAPIDAPI_DAILY_LIMIT : API_LIMITS.GEMINI_DAILY_LIMIT
  
  if (usage.count >= limit) {
    return {
      success: false,
      currentCount: usage.count,
      limit,
      remaining: 0
    }
  }
  
  usage.count += 1
  
  return {
    success: true,
    currentCount: usage.count,
    limit,
    remaining: limit - usage.count
  }
}

/**
 * 获取 API 使用统计
 */
export function getApiUsageStats(): {
  rapidapi: {
    count: number
    limit: number
    remaining: number
    resetTime: number
    percentage: number
  }
  gemini: {
    count: number
    limit: number
    remaining: number
    resetTime: number
    percentage: number
  }
} {
  resetDailyCounters()
  
  const rapidapiUsage = apiUsageStore.rapidapi
  const geminiUsage = apiUsageStore.gemini
  
  return {
    rapidapi: {
      count: rapidapiUsage.count,
      limit: API_LIMITS.RAPIDAPI_DAILY_LIMIT,
      remaining: API_LIMITS.RAPIDAPI_DAILY_LIMIT - rapidapiUsage.count,
      resetTime: rapidapiUsage.resetTime,
      percentage: Math.round((rapidapiUsage.count / API_LIMITS.RAPIDAPI_DAILY_LIMIT) * 100)
    },
    gemini: {
      count: geminiUsage.count,
      limit: API_LIMITS.GEMINI_DAILY_LIMIT,
      remaining: API_LIMITS.GEMINI_DAILY_LIMIT - geminiUsage.count,
      resetTime: geminiUsage.resetTime,
      percentage: Math.round((geminiUsage.count / API_LIMITS.GEMINI_DAILY_LIMIT) * 100)
    }
  }
}

/**
 * 手动重置 API 计数器（仅用于测试）
 */
export function resetApiCounters() {
  const currentDate = getCurrentDateString()
  const resetTime = getNextResetTime()
  
  apiUsageStore = {
    rapidapi: { count: 0, date: currentDate, resetTime },
    gemini: { count: 0, date: currentDate, resetTime }
  }
}

/**
 * 获取原始使用数据（用于调试）
 */
export function getApiUsageRaw() {
  return { ...apiUsageStore }
}
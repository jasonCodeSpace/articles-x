// API access logging and monitoring utility
// Provides request/response logging and basic monitoring capabilities

import { NextRequest } from 'next/server';
import { getClientId } from './rate-limit';

export interface ApiLogEntry {
  timestamp: string;
  method: string;
  path: string;
  clientId: string;
  userAgent?: string;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  requestId: string;
}

// In-memory log store (use external logging service in production)
const apiLogs: ApiLogEntry[] = [];
const MAX_LOGS = 1000; // Keep last 1000 logs in memory

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log API request start
 * @param request - Next.js request object
 * @returns Request ID for correlation
 */
export function logApiRequest(request: NextRequest): string {
  const requestId = generateRequestId();
  const clientId = getClientId(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  
  const logEntry: ApiLogEntry = {
    timestamp: new Date().toISOString(),
    method: request.method,
    path: new URL(request.url).pathname,
    clientId,
    userAgent,
    requestId
  };
  
  // Add to logs
  apiLogs.push(logEntry);
  
  // Keep only recent logs
  if (apiLogs.length > MAX_LOGS) {
    apiLogs.shift();
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${logEntry.method} ${logEntry.path} - ${requestId} from ${clientId}`);
  }
  
  return requestId;
}

/**
 * Log API response completion
 * @param requestId - Request ID from logApiRequest
 * @param statusCode - HTTP status code
 * @param startTime - Request start time for calculating response time
 * @param error - Optional error message
 */
export function logApiResponse(
  requestId: string,
  statusCode: number,
  startTime: number,
  error?: string
): void {
  const logEntry = apiLogs.find(log => log.requestId === requestId);
  
  if (logEntry) {
    logEntry.statusCode = statusCode;
    logEntry.responseTime = Date.now() - startTime;
    if (error) {
      logEntry.error = error;
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const status = statusCode >= 400 ? 'ERROR' : 'SUCCESS';
      console.log(
        `[API] ${status} ${logEntry.method} ${logEntry.path} - ` +
        `${statusCode} in ${logEntry.responseTime}ms${error ? ` - ${error}` : ''}`
      );
    }
  }
}

/**
 * Get API logs for monitoring
 * @param limit - Maximum number of logs to return
 * @param filter - Optional filter criteria
 * @returns Array of log entries
 */
export function getApiLogs(
  limit: number = 100,
  filter?: {
    method?: string;
    path?: string;
    statusCode?: number;
    clientId?: string;
    since?: Date;
  }
): ApiLogEntry[] {
  let filteredLogs = [...apiLogs];
  
  if (filter) {
    filteredLogs = filteredLogs.filter(log => {
      if (filter.method && log.method !== filter.method) return false;
      if (filter.path && !log.path.includes(filter.path)) return false;
      if (filter.statusCode && log.statusCode !== filter.statusCode) return false;
      if (filter.clientId && log.clientId !== filter.clientId) return false;
      if (filter.since && new Date(log.timestamp) < filter.since) return false;
      return true;
    });
  }
  
  // Sort by timestamp (newest first) and limit
  return filteredLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/**
 * Get API statistics
 * @param timeWindow - Time window in minutes (default: 60)
 * @returns API usage statistics
 */
export function getApiStats(timeWindow: number = 60): {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  topPaths: Array<{ path: string; count: number }>;
  topClients: Array<{ clientId: string; count: number }>;
  errorRate: number;
} {
  const since = new Date(Date.now() - timeWindow * 60 * 1000);
  const recentLogs = getApiLogs(Infinity, { since });
  
  const totalRequests = recentLogs.length;
  const successfulRequests = recentLogs.filter(log => 
    log.statusCode && log.statusCode < 400
  ).length;
  const errorRequests = totalRequests - successfulRequests;
  
  const responseTimes = recentLogs
    .filter(log => log.responseTime !== undefined)
    .map(log => log.responseTime!);
  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0;
  
  // Count paths
  const pathCounts = new Map<string, number>();
  recentLogs.forEach(log => {
    const count = pathCounts.get(log.path) || 0;
    pathCounts.set(log.path, count + 1);
  });
  
  const topPaths = Array.from(pathCounts.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Count clients
  const clientCounts = new Map<string, number>();
  recentLogs.forEach(log => {
    const count = clientCounts.get(log.clientId) || 0;
    clientCounts.set(log.clientId, count + 1);
  });
  
  const topClients = Array.from(clientCounts.entries())
    .map(([clientId, count]) => ({ clientId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
  
  return {
    totalRequests,
    successfulRequests,
    errorRequests,
    averageResponseTime: Math.round(averageResponseTime),
    topPaths,
    topClients,
    errorRate: Math.round(errorRate * 100) / 100
  };
}

/**
 * Middleware wrapper for automatic API logging
 * @param handler - API route handler
 * @returns Wrapped handler with logging
 */
export function withApiLogging<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const startTime = Date.now();
    const requestId = logApiRequest(request);
    
    try {
      const response = await handler(request, ...args);
      logApiResponse(requestId, response.status, startTime);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logApiResponse(requestId, 500, startTime, errorMessage);
      throw error;
    }
  };
}

/**
 * Clear old logs to prevent memory leaks
 * @param olderThanHours - Remove logs older than this many hours
 */
export function clearOldLogs(olderThanHours: number = 24): void {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  
  for (let i = apiLogs.length - 1; i >= 0; i--) {
    if (new Date(apiLogs[i].timestamp) < cutoff) {
      apiLogs.splice(i, 1);
    }
  }
}

// Auto cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => clearOldLogs(), 60 * 60 * 1000);
}
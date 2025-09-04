// Admin API logs endpoint
// Provides access to API logs and statistics for monitoring

import { NextRequest } from 'next/server';
import { getApiLogs, getApiStats } from '@/lib/api-logger';
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientId, getRateLimitInfo } from '@/lib/rate-limit';
import { createErrorResponse, createSuccessResponse } from '@/lib/error-handler';

/**
 * Check if request is authorized (admin access)
 */
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const secretFromQuery = request.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    return false;
  }
  
  // Check Authorization header
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    return token === cronSecret;
  }
  
  // Check query parameter
  if (secretFromQuery) {
    return secretFromQuery === cronSecret;
  }
  
  return false;
}

/**
 * GET /api/admin/logs
 * Get API logs and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const clientId = getClientId(request);
    const isAllowed = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.public);
    if (!isAllowed) {
      const rateLimitInfo = getRateLimitInfo(clientId, RATE_LIMIT_CONFIGS.public);
      return createErrorResponse(
        'RATE_LIMITED',
        'Too many requests',
        `Retry after ${Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000)} seconds`
      );
    }
    
    // Check authorization
    if (!isAuthorized(request)) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Admin access required'
      );
    }
    
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'logs';
    
    switch (action) {
      case 'logs': {
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const method = url.searchParams.get('method') || undefined;
        const path = url.searchParams.get('path') || undefined;
        const statusCode = url.searchParams.get('statusCode') 
          ? parseInt(url.searchParams.get('statusCode')!) 
          : undefined;
        const clientId = url.searchParams.get('clientId') || undefined;
        const since = url.searchParams.get('since') 
          ? new Date(url.searchParams.get('since')!) 
          : undefined;
        
        const logs = getApiLogs(limit, {
          method,
          path,
          statusCode,
          clientId,
          since
        });
        
        return createSuccessResponse({
          logs,
          total: logs.length,
          filters: { method, path, statusCode, clientId, since }
        });
      }
      
      case 'stats': {
        const timeWindow = parseInt(url.searchParams.get('timeWindow') || '60');
        const stats = getApiStats(timeWindow);
        
        return createSuccessResponse({
          stats,
          timeWindow,
          timestamp: new Date().toISOString()
        });
      }
      
      case 'health': {
        const stats = getApiStats(5); // Last 5 minutes
        const isHealthy = stats.errorRate < 10; // Less than 10% error rate
        
        return createSuccessResponse({
          healthy: isHealthy,
          errorRate: stats.errorRate,
          totalRequests: stats.totalRequests,
          averageResponseTime: stats.averageResponseTime,
          timestamp: new Date().toISOString()
        });
      }
      
      default:
        return createErrorResponse(
          'BAD_REQUEST',
          'Invalid action. Supported actions: logs, stats, health'
        );
    }
    
  } catch (error) {
    console.error('Admin logs API error:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Service temporarily unavailable'
    );
  }
}
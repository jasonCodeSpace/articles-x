import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkRateLimit, getClientId, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { logApiRequest, logApiResponse } from '@/lib/api-logger';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';
const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');
  
  return (authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) ||
         querySecret === CRON_SECRET;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = logApiRequest(request);
  
  // Rate limiting
  const clientId = getClientId(request);
  if (!checkRateLimit(clientId, RATE_LIMIT_CONFIGS.public)) {
    const response = NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
    logApiResponse(requestId, 429, startTime, 'Rate limit exceeded');
    return response;
  }

  // Check authorization for detailed health info
  const isAuth = isAuthorized(request);
  
  // Public health check - minimal info
  if (!isAuth) {
    const basicChecks = {
      timestamp: new Date().toISOString(),
      status: 'checking'
    };
    
    // Basic database connectivity check
    try {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from('tweets')
        .select('count')
        .limit(1);
      
      const isHealthy = !error;
      
      const response = NextResponse.json({
        healthy: isHealthy,
        timestamp: basicChecks.timestamp,
        status: isHealthy ? 'operational' : 'degraded'
      }, {
        status: isHealthy ? 200 : 503
      });
      logApiResponse(requestId, isHealthy ? 200 : 503, startTime);
      return response;
    } catch {
      const response = NextResponse.json({
        healthy: false,
        timestamp: basicChecks.timestamp,
        status: 'degraded'
      }, {
        status: 503
      });
      logApiResponse(requestId, 503, startTime, 'Database connection failed');
      return response;
    }
  }
  
  // Detailed health check for authorized requests
  const checks = {
    timestamp: new Date().toISOString(),
    environment: {
      rapidApiKey: {
        configured: !!RAPIDAPI_KEY
      },
      cronSecret: {
        configured: !!CRON_SECRET
      }
    },
    database: {
      status: 'unknown' as 'unknown' | 'healthy' | 'error',
      error: null as string | null
    },
    twitterApi: {
      status: 'unknown' as 'unknown' | 'healthy' | 'error' | 'warning',
      error: null as string | null
    }
  };

  // Test database connection
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('tweets')
      .select('count')
      .limit(1);
    
    if (error) {
      checks.database.status = 'error';
      checks.database.error = 'Database connection failed';
    } else {
      checks.database.status = 'healthy';
    }
  } catch {
    checks.database.status = 'error';
    checks.database.error = 'Database connection failed';
  }

  // Test Twitter API (only if RAPIDAPI_KEY is configured)
  if (RAPIDAPI_KEY) {
    try {
      // Use a simple API call to test connectivity
      const response = await fetch(`https://${RAPIDAPI_HOST}/tweet?pid=1234567890`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      });

      if (response.status === 401) {
        checks.twitterApi.status = 'error';
        checks.twitterApi.error = 'Authentication failed';
      } else if (response.status === 403) {
        checks.twitterApi.status = 'error';
        checks.twitterApi.error = 'Access forbidden';
      } else if (response.status === 404) {
        // 404 is expected for a non-existent tweet, but means API is accessible
        checks.twitterApi.status = 'healthy';
      } else if (response.status === 429) {
        checks.twitterApi.status = 'warning';
        checks.twitterApi.error = 'Rate limited';
      } else {
        checks.twitterApi.status = 'healthy';
      }
    } catch {
      checks.twitterApi.status = 'error';
      checks.twitterApi.error = 'API connection failed';
    }
  } else {
    checks.twitterApi.status = 'error';
    checks.twitterApi.error = 'API key not configured';
  }

  // Determine overall health
  const isHealthy = checks.database.status === 'healthy' && 
                   (checks.twitterApi.status === 'healthy' || checks.twitterApi.status === 'warning');

  const response = NextResponse.json({
    healthy: isHealthy,
    checks
  }, {
    status: isHealthy ? 200 : 503
  });
  logApiResponse(requestId, isHealthy ? 200 : 503, startTime);
  return response;
}
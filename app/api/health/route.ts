import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: {
      rapidApiKey: {
        configured: !!RAPIDAPI_KEY,
        length: RAPIDAPI_KEY ? RAPIDAPI_KEY.length : 0
      },
      cronSecret: {
        configured: !!CRON_SECRET,
        length: CRON_SECRET ? CRON_SECRET.length : 0
      },
      rapidApiHost: RAPIDAPI_HOST
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
      checks.database.error = error.message;
    } else {
      checks.database.status = 'healthy';
    }
  } catch (error) {
    checks.database.status = 'error';
    checks.database.error = error instanceof Error ? error.message : 'Unknown database error';
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
        checks.twitterApi.error = 'Invalid API key';
      } else if (response.status === 403) {
        checks.twitterApi.status = 'error';
        checks.twitterApi.error = 'API access forbidden - check quota or permissions';
      } else if (response.status === 404) {
        // 404 is expected for a non-existent tweet, but means API is accessible
        checks.twitterApi.status = 'healthy';
      } else if (response.status === 429) {
        checks.twitterApi.status = 'warning';
        checks.twitterApi.error = 'Rate limited';
      } else {
        checks.twitterApi.status = 'healthy';
      }
    } catch (error) {
      checks.twitterApi.status = 'error';
      checks.twitterApi.error = error instanceof Error ? error.message : 'Unknown API error';
    }
  } else {
    checks.twitterApi.status = 'error';
    checks.twitterApi.error = 'RAPIDAPI_KEY not configured';
  }

  // Determine overall health
  const isHealthy = checks.database.status === 'healthy' && 
                   (checks.twitterApi.status === 'healthy' || checks.twitterApi.status === 'warning');

  return NextResponse.json({
    healthy: isHealthy,
    checks
  }, {
    status: isHealthy ? 200 : 503
  });
}
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simple debug endpoint to check environment variables
  const cronSecret = process.env.CRON_SECRET;
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  
  return NextResponse.json({
    cronSecretConfigured: !!cronSecret,
    cronSecretLength: cronSecret ? cronSecret.length : 0,
    cronSecretFirst10: cronSecret ? cronSecret.substring(0, 10) : 'not set',
    rapidApiKeyConfigured: !!rapidApiKey,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
}
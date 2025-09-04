import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientId, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'
import { logApiRequest, logApiResponse } from '@/lib/api-logger'

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

  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null)
    
    if (error) {
      console.error('Error fetching categories:', error)
      const response = NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
      logApiResponse(requestId, 500, startTime, 'Database error');
      return response;
    }
    
    const uniqueCategories = new Set<string>()
    data?.forEach((article: { category: string }) => {
      if (article.category) {
        // Split comma-separated categories and add all of them
        article.category.split(',').forEach(cat => {
          const trimmedCat = cat.trim()
          if (trimmedCat) {
            uniqueCategories.add(trimmedCat)
          }
        })
      }
    })
    
    const categories = Array.from(uniqueCategories).sort()
    
    const response = NextResponse.json({ categories })
    logApiResponse(requestId, 200, startTime);
    return response;
  } catch (error) {
    console.error('Error fetching categories:', error)
    const response = NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 500 })
    logApiResponse(requestId, 500, startTime, 'Internal server error');
    return response;
  }
}
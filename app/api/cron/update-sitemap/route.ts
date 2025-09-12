import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== CRON_SECRET) {
      console.error('Unauthorized access attempt to update-sitemap API')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting sitemap update process...')
    
    const baseUrl = 'https://www.xarticle.news'
    const sitemapUrls = [
      `${baseUrl}/sitemap-index.xml`,
      `${baseUrl}/sitemap-static.xml`,
      `${baseUrl}/sitemap-categories.xml`,
      `${baseUrl}/sitemap-authors.xml`
    ]

    // Get article date range to determine monthly sitemaps
    const supabase = createServiceClient()
    const { data: dateRange } = await supabase
      .from('articles')
      .select('article_published_at')
      .not('article_published_at', 'is', null)
      .not('slug', 'is', null)
      .order('article_published_at', { ascending: true })
      .limit(1)
    
    const { data: latestDate } = await supabase
      .from('articles')
      .select('article_published_at')
      .not('article_published_at', 'is', null)
      .not('slug', 'is', null)
      .order('article_published_at', { ascending: false })
      .limit(1)

    // Add monthly sitemap URLs
    if (dateRange && dateRange[0] && latestDate && latestDate[0]) {
      const startDate = new Date(dateRange[0].article_published_at)
      const endDate = new Date(latestDate[0].article_published_at)
      
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
      
      while (current <= end) {
        const year = current.getFullYear()
        const month = String(current.getMonth() + 1).padStart(2, '0')
        sitemapUrls.push(`${baseUrl}/sitemap-articles-${year}-${month}.xml`)
        current.setMonth(current.getMonth() + 1)
      }
    }

    // Trigger sitemap regeneration by making requests to each sitemap URL
    const results = []
    for (const url of sitemapUrls) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Sitemap-Updater/1.0'
          }
        })
        
        if (response.ok) {
          results.push({ url, status: 'success', statusCode: response.status })
          console.log(`✅ Updated sitemap: ${url}`)
        } else {
          results.push({ url, status: 'error', statusCode: response.status })
          console.error(`❌ Failed to update sitemap: ${url} (${response.status})`)
        }
      } catch (error) {
        results.push({ url, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
        console.error(`❌ Error updating sitemap: ${url}`, error)
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const totalCount = results.length

    console.log(`Sitemap update completed: ${successCount}/${totalCount} successful`)

    return NextResponse.json({
      success: true,
      message: `Sitemap update completed: ${successCount}/${totalCount} successful`,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in sitemap update process:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET method for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}
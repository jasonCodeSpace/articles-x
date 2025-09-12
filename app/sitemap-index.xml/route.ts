import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the earliest and latest article dates to determine date range
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

    const baseUrl = 'https://www.xarticle.news'
    const currentDate = new Date().toISOString()
    
    // Generate monthly sitemaps for articles
    const monthlySitemaps: string[] = []
    
    if (dateRange && dateRange[0] && latestDate && latestDate[0]) {
      const startDate = new Date(dateRange[0].article_published_at)
      const endDate = new Date(latestDate[0].article_published_at)
      
      // Generate monthly sitemaps from start to end
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
      
      while (current <= end) {
        const year = current.getFullYear()
        const month = String(current.getMonth() + 1).padStart(2, '0')
        monthlySitemaps.push(`${baseUrl}/sitemap-articles-${year}-${month}.xml`)
        current.setMonth(current.getMonth() + 1)
      }
    }

    const sitemaps = [
      {
        url: `${baseUrl}/sitemap-static.xml`,
        lastmod: currentDate
      },
      {
        url: `${baseUrl}/sitemap-categories.xml`,
        lastmod: currentDate
      },
      {
        url: `${baseUrl}/sitemap-authors.xml`,
        lastmod: currentDate
      },
      ...monthlySitemaps.map(url => ({ url, lastmod: currentDate }))
    ]

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${sitemap.url}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`

    return new NextResponse(sitemapIndex, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap index:', error)
    return new NextResponse('Error generating sitemap index', { status: 500 })
  }
}
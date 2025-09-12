import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

interface Params {
  year: string
  month: string
}

export async function GET(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { year, month } = await params
    const supabase = createServiceClient()
    
    // Validate year and month
    const yearNum = parseInt(year)
    const monthNum = parseInt(month)
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return new NextResponse('Invalid year or month', { status: 400 })
    }
    
    // Calculate date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1)
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999)
    
    // Get articles for this month
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, article_published_at, updated_at, language')
      .not('slug', 'is', null)
      .not('article_published_at', 'is', null)
      .not('language', 'is', null)
      .gte('article_published_at', startDate.toISOString())
      .lte('article_published_at', endDate.toISOString())
      .order('article_published_at', { ascending: false })
    
    if (!articles || articles.length === 0) {
      return new NextResponse('No articles found for this month', { status: 404 })
    }

    const baseUrl = 'https://www.xarticle.news'
    
    const articleUrls: Array<{url: string, lastmod: string, changefreq: string, priority: string}> = []
    
    articles.forEach(article => {
      const publishedDate = new Date(article.article_published_at)
      const lastmod = article.updated_at 
        ? new Date(article.updated_at).toISOString()
        : new Date(article.article_published_at).toISOString()
      
      // Use the correct URL structure with year/month/day format
      const year = publishedDate.getFullYear()
      const month = String(publishedDate.getMonth() + 1).padStart(2, '0')
      const day = String(publishedDate.getDate()).padStart(2, '0')
      
      // Only add URL for the article's actual language
      if (article.language) {
        articleUrls.push({
          url: `/${article.language}/article/${year}/${month}/${day}/${article.slug}`,
          lastmod,
          changefreq: 'monthly',
          priority: '0.8'
        })
      }
    })

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${articleUrls.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating monthly articles sitemap:', error)
    return new NextResponse('Error generating monthly articles sitemap', { status: 500 })
  }
}
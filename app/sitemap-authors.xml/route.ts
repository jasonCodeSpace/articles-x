import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get all authors with article counts
    const { data: articles } = await supabase
      .from('articles')
      .select('author')
      .not('author', 'is', null)
      .not('slug', 'is', null)
      .not('published_at', 'is', null)
    
    if (!articles) {
      throw new Error('Failed to fetch authors')
    }

    // Get unique authors and their article counts
    const authorMap = new Map<string, number>()
    articles.forEach(article => {
      if (article.author) {
        const count = authorMap.get(article.author) || 0
        authorMap.set(article.author, count + 1)
      }
    })

    const baseUrl = 'https://www.xarticle.news'
    const currentDate = new Date().toISOString()
    
    const authorUrls = Array.from(authorMap.entries()).map(([author, count]) => {
      const priority = count > 20 ? '0.7' : count > 10 ? '0.6' : '0.5'
      return {
        url: `/author/${encodeURIComponent(author.toLowerCase().replace(/\s+/g, '-'))}`,
        priority,
        changefreq: 'weekly'
      }
    })

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${authorUrls.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <!-- Multi-language support for authors -->
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en${page.url}" />
    <xhtml:link rel="alternate" hreflang="zh" href="${baseUrl}/zh${page.url}" />
    <xhtml:link rel="alternate" hreflang="ja" href="${baseUrl}/ja${page.url}" />
    <xhtml:link rel="alternate" hreflang="ko" href="${baseUrl}/ko${page.url}" />
    <xhtml:link rel="alternate" hreflang="es" href="${baseUrl}/es${page.url}" />
    <xhtml:link rel="alternate" hreflang="fr" href="${baseUrl}/fr${page.url}" />
    <xhtml:link rel="alternate" hreflang="de" href="${baseUrl}/de${page.url}" />
    <xhtml:link rel="alternate" hreflang="it" href="${baseUrl}/it${page.url}" />
    <xhtml:link rel="alternate" hreflang="pt" href="${baseUrl}/pt${page.url}" />
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/ru${page.url}" />
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/ar${page.url}" />
    <xhtml:link rel="alternate" hreflang="hi" href="${baseUrl}/hi${page.url}" />
    <xhtml:link rel="alternate" hreflang="th" href="${baseUrl}/th${page.url}" />
    <xhtml:link rel="alternate" hreflang="vi" href="${baseUrl}/vi${page.url}" />
    <xhtml:link rel="alternate" hreflang="tr" href="${baseUrl}/tr${page.url}" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl${page.url}" />
    <xhtml:link rel="alternate" hreflang="nl" href="${baseUrl}/nl${page.url}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${page.url}" />
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating authors sitemap:', error)
    return new NextResponse('Error generating authors sitemap', { status: 500 })
  }
}
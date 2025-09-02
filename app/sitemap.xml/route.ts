import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Fetch all articles
    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, article_published_at')
      .order('article_published_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching articles for sitemap:', error)
      return new NextResponse('Error generating sitemap', { status: 500 })
    }
    
    // Fetch all categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null)
    
    if (categoriesError) {
      console.error('Error fetching categories for sitemap:', categoriesError)
    }
    
    const categories = [...new Set(categoriesData?.map(item => item.category).filter(Boolean) || [])]
    
    const baseUrl = 'https://www.xarticle.news'
    const currentDate = new Date().toISOString()
    
    // Static pages
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/new', priority: '0.9', changefreq: 'hourly' },
      { url: '/landing', priority: '0.8', changefreq: 'weekly' },
      { url: '/history', priority: '0.7', changefreq: 'daily' },
      { url: '/weekly', priority: '0.8', changefreq: 'weekly' },
      { url: '/login', priority: '0.5', changefreq: 'monthly' },
      { url: '/register', priority: '0.5', changefreq: 'monthly' }
    ]
    
    // Generate XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${categories.map((category: string) => `  <url>
    <loc>${baseUrl}/category/${encodeURIComponent(category)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
${articles?.map((article: { slug: string; article_published_at?: string }) => `  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <lastmod>${article.article_published_at || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n') || ''}
</urlset>`
    
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}
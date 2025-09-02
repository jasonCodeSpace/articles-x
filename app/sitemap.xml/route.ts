import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Fetch all articles first, then filter invalid slugs
    const { data: allArticles, error } = await supabase
      .from('articles')
      .select('slug, article_published_at')
      .not('slug', 'eq', '')
      .not('slug', 'is', null)
      .order('article_published_at', { ascending: false })
    
    // Filter out invalid slugs (only remove clearly invalid ones)
    const articles = allArticles?.filter(article => 
      article.slug && 
      !article.slug.startsWith('--') && // Remove slugs starting with --
      !article.slug.startsWith('-') && // Remove slugs starting with single -
      article.slug.length > 10 && // Ensure minimum length
      !article.slug.match(/^-+$/) // Remove slugs that are only dashes
    ) || []
    
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
    
    // Normalize categories to lowercase and remove duplicates
    const categories = [...new Set(
      categoriesData?.map(item => item.category)
        .filter(Boolean)
        .map(cat => cat.toLowerCase()) || []
    )]
    
    const baseUrl = 'https://www.xarticle.news'
    const currentDate = new Date().toISOString()
    
    // Static content pages only (exclude auth pages)
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/new', priority: '0.9', changefreq: 'hourly' },
      { url: '/landing', priority: '0.8', changefreq: 'weekly' },
      { url: '/history', priority: '0.7', changefreq: 'daily' },
      { url: '/weekly', priority: '0.8', changefreq: 'weekly' }
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
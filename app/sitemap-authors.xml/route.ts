import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get all authors with article counts
    const { data: articles } = await supabase
      .from('articles')
      .select('author_name')
      .not('author_name', 'is', null)
      .not('slug', 'is', null)
      .not('article_published_at', 'is', null)
    
    if (!articles) {
      throw new Error('Failed to fetch authors')
    }

    // Get unique authors and their article counts
    const authorMap = new Map<string, number>()
    articles.forEach(article => {
      if (article.author_name) {
        const count = authorMap.get(article.author_name) || 0
        authorMap.set(article.author_name, count + 1)
      }
    })

    const baseUrl = 'https://www.xarticle.news'
    const currentDate = new Date().toISOString()
    
    // Create SEO-friendly author slugs
    const createAuthorSlug = (authorName: string): string => {
      return authorName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .trim()
    }

    const authorUrls = Array.from(authorMap.entries()).map(([author, count]) => {
      const priority = count > 20 ? '0.7' : count > 10 ? '0.6' : '0.5'
      const slug = createAuthorSlug(author)
      return {
        url: `/author/${slug}`,
        priority,
        changefreq: 'daily' // Changed to daily for better SEO
      }
    }).filter(item => item.url !== '/author/') // Filter out empty slugs

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${authorUrls.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        // Cache for 12 hours to allow twice-daily regeneration
        'Cache-Control': 'public, max-age=43200, s-maxage=43200',
      },
    })
  } catch (error) {
    console.error('Error generating authors sitemap:', error)
    return new NextResponse('Error generating authors sitemap', { status: 500 })
  }
}
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get all categories with article counts
    const { data: categories } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null)
      .not('slug', 'is', null)
      .not('published_at', 'is', null)
    
    if (!categories) {
      throw new Error('Failed to fetch categories')
    }

    // Get unique categories and their counts
    const categoryMap = new Map<string, number>()
    categories.forEach(article => {
      if (article.category) {
        const count = categoryMap.get(article.category) || 0
        categoryMap.set(article.category, count + 1)
      }
    })

    const baseUrl = 'https://www.xarticle.news'
    const currentDate = new Date().toISOString()
    
    const categoryUrls: Array<{url: string, priority: string, changefreq: string}> = []
    
    Array.from(categoryMap.entries()).forEach(([category, count]) => {
      const priority = count > 50 ? '0.8' : count > 20 ? '0.7' : '0.6'
      const encodedCategory = encodeURIComponent(category.toLowerCase())
      
      // Add both Chinese and English versions
      categoryUrls.push(
        {
          url: `/category/${encodedCategory}`,
          priority,
          changefreq: 'daily'
        },
        {
          url: `/zh/category/${encodedCategory}`,
          priority,
          changefreq: 'daily'
        },
        {
          url: `/en/category/${encodedCategory}`,
          priority,
          changefreq: 'daily'
        }
      )
    })

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categoryUrls.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
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
    console.error('Error generating categories sitemap:', error)
    return new NextResponse('Error generating categories sitemap', { status: 500 })
  }
}
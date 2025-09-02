import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Function to escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Function to validate and clean article slugs
function isValidSlug(slug: string): boolean {
  return Boolean(slug && 
    slug.length > 10 && 
    slug.length < 200 && // Prevent extremely long URLs
    !slug.startsWith('--') && 
    !slug.startsWith('-') && 
    !slug.match(/^-+$/) &&
    !slug.includes('..') && // Prevent path traversal patterns
    !slug.match(/[<>&"']/) && // Prevent XML breaking characters
    slug.match(/^[a-zA-Z0-9\-_]+$/)) // Only allow safe URL characters
}

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
    
    // Filter out invalid slugs with comprehensive validation
    const validArticles: Array<{ slug: string; article_published_at?: string }> = []
    const invalidSlugs: string[] = []
    
    allArticles?.forEach(article => {
      if (article.slug && isValidSlug(article.slug)) {
        validArticles.push(article)
      } else if (article.slug) {
        invalidSlugs.push(article.slug)
      }
    })
    
    // Log invalid slugs for debugging
    if (invalidSlugs.length > 0) {
      console.warn(`Sitemap: Filtered out ${invalidSlugs.length} invalid slugs:`, invalidSlugs.slice(0, 10))
    }
    
    const articles = validArticles
    
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
      { url: '/trending', priority: '0.9', changefreq: 'hourly' },
      { url: '/landing', priority: '0.8', changefreq: 'weekly' },
      { url: '/history', priority: '0.7', changefreq: 'daily' },
      { url: '/weekly', priority: '0.8', changefreq: 'weekly' }
    ]
    
    // Generate XML with proper escaping and validation
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${escapeXml(baseUrl + page.url)}</loc>
    <lastmod>${escapeXml(currentDate)}</lastmod>
    <changefreq>${escapeXml(page.changefreq)}</changefreq>
    <priority>${escapeXml(page.priority)}</priority>
  </url>`).join('\n')}
${categories.map((category: string) => `  <url>
    <loc>${escapeXml(baseUrl + '/category/' + encodeURIComponent(category))}</loc>
    <lastmod>${escapeXml(currentDate)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
${articles?.map((article: { slug: string; article_published_at?: string }) => `  <url>
    <loc>${escapeXml(baseUrl + '/article/' + encodeURIComponent(article.slug))}</loc>
    <lastmod>${escapeXml(article.article_published_at || currentDate)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n') || ''}
</urlset>`
    
    // Validate sitemap size constraints
    const sitemapSize = Buffer.byteLength(sitemap, 'utf8')
    const urlCount = articles.length + categories.length + staticPages.length
    
    if (sitemapSize > 50 * 1024 * 1024) { // 50MB limit
      console.error(`Sitemap too large: ${sitemapSize} bytes`)
      return new NextResponse('Sitemap too large', { status: 500 })
    }
    
    if (urlCount > 50000) { // 50k URL limit
      console.warn(`Sitemap has ${urlCount} URLs, consider splitting into multiple sitemaps`)
    }
    
    console.log(`Generated sitemap with ${urlCount} URLs (${Math.round(sitemapSize / 1024)}KB)`)
    
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
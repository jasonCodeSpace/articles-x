import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Function to escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Function to normalize timestamp to consistent ISO format with Z
function normalizeTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return new Date().toISOString()
  }

  try {
    // Parse and convert to consistent ISO format with Z
    return new Date(timestamp).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

// Function to validate and clean article slugs
function isValidSlug(slug: string): boolean {
  // Basic validation: slug should exist and not be empty
  if (!slug || typeof slug !== 'string') {
    return false
  }

  // Remove any leading/trailing slashes or whitespace
  const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '')
  if (!cleanSlug) {
    return false
  }

  // Check for obviously invalid slugs
  if (cleanSlug.includes('..') || cleanSlug.includes('//')) {
    return false
  }

  // Slug should be reasonable length (1-200 chars)
  if (cleanSlug.length < 1 || cleanSlug.length > 200) {
    return false
  }

  // Optional: Check for the title-with-hyphens--shortId format
  // but don't reject articles that don't match perfectly
  // This allows more flexibility while still catching truly invalid slugs
  const parts = cleanSlug.split('--')
  if (parts.length >= 1) {
    // Has at least one part, that's good enough
    return true
  }

  return true
}

export async function GET() {
  try {
    const supabase = createServiceClient()
    const currentDate = new Date().toISOString()

    // Fetch articles with valid slugs
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('slug, article_published_at, updated_at')
      .not('slug', 'is', null)
      .neq('slug', '')
      .order('article_published_at', { ascending: false })

    if (articlesError) {
      console.error('Error fetching articles for sitemap:', articlesError)
      return new NextResponse('Error generating sitemap', { status: 500 })
    }

    // Filter articles with valid slugs
    const allArticles = articles || []
    console.log(`[Sitemap] Found ${allArticles.length} total articles in database`)

    // Log first few slugs for debugging
    if (allArticles.length > 0) {
      const sampleSlugs = allArticles.slice(0, 5).map(a => a.slug)
      console.log(`[Sitemap] Sample slugs:`, sampleSlugs)
    }

    const validArticles = allArticles.filter(article => {
      if (!article.slug) {
        return false
      }
      const isValid = isValidSlug(article.slug)
      if (!isValid && allArticles.length < 20) {
        // Only log invalid slugs when there are few articles (for debugging)
        console.log(`[Sitemap] Invalid slug filtered: "${article.slug}"`)
      }
      return isValid
    })

    console.log(`[Sitemap] ${validArticles.length} articles passed validation`)

    const baseUrl = 'https://www.xarticle.news'

    // Core pages with priority structure
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/trending', priority: '0.9', changefreq: 'hourly' },
      { url: '/summary', priority: '0.9', changefreq: 'daily' },
      { url: '/summaries', priority: '0.8', changefreq: 'daily' },
      { url: '/about', priority: '0.5', changefreq: 'monthly' },
      { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
      { url: '/terms', priority: '0.3', changefreq: 'yearly' }
    ]

    // Generate optimized sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => {
      if (page.priority && page.changefreq) {
        return `  <url>
    <loc>${escapeXml(baseUrl + page.url)}</loc>
    <lastmod>${escapeXml(currentDate)}</lastmod>
    <changefreq>${escapeXml(page.changefreq)}</changefreq>
    <priority>${escapeXml(page.priority)}</priority>
  </url>`
      } else {
        return `  <url>
    <loc>${escapeXml(baseUrl + page.url)}</loc>
    <lastmod>${escapeXml(currentDate)}</lastmod>
  </url>`
      }
    }).join('\n')}
${validArticles?.map((article: { slug: string; article_published_at?: string; updated_at?: string }) => `  <url>
    <loc>${escapeXml(baseUrl + '/article/' + encodeURIComponent(article.slug))}</loc>
    <lastmod>${escapeXml(normalizeTimestamp(article.updated_at || article.article_published_at))}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`).join('\n') || ''}
</urlset>`

    // Validate sitemap size constraints
    const sitemapSize = Buffer.byteLength(sitemap, 'utf8')
    const urlCount = validArticles.length + staticPages.length

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

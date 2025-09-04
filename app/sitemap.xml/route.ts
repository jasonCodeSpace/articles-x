import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateCategorySlug } from '@/lib/url-utils'

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

// Function to normalize category names and handle duplicates
function normalizeCategory(category: string): string {
  const normalized = category.trim().toLowerCase()
  
  // Handle known duplicates - merge "technology" into "tech"
  if (normalized === 'technology') {
    return 'tech'
  }
  
  return normalized
}

// Function to validate and clean article slugs
function isValidSlug(slug: string): boolean {
  // Check if slug follows the correct format: title-with-hyphens--shortId
  const parts = slug.split('--')
  if (parts.length !== 2) {
    return false
  }
  
  const titlePart = parts[0]
  const idPart = parts[1]
  
  // Title part should be properly formatted with hyphens separating words
  // Reject slugs that are too long without proper word separation
  if (titlePart.length > 50) {
    return false
  }
  
  // Title part should not contain very long sequences without hyphens (indicating poor formatting)
  const words = titlePart.split('-')
  const hasLongWord = words.some(word => word.length > 15)
  if (hasLongWord) {
    return false
  }
  
  // ID part should be exactly 6 characters (hex)
  if (idPart.length !== 6 || !/^[a-f0-9]{6}$/i.test(idPart)) {
    return false
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
      .select('slug, article_published_at, updated_at, category')
      .not('slug', 'is', null)
      .neq('slug', '')
      .order('article_published_at', { ascending: false })
    
    if (articlesError) {
      console.error('Error fetching articles for sitemap:', articlesError)
      return new NextResponse('Error generating sitemap', { status: 500 })
    }
    
    // Filter articles with valid slugs
    const validArticles = (articles || [])
      .filter(article => article.slug && isValidSlug(article.slug))
    
    // Define standard categories (same as in category layout)
    const standardCategories = [
      'Hardware',
      'Gaming', 
      'Health',
      'Environment',
      'Personal Story',
      'Culture',
      'Philosophy',
      'History',
      'Education',
      'Design',
      'Marketing',
      'AI',
      'Crypto',
      'Tech',
      'Data',
      'Startups',
      'Business',
      'Markets',
      'Product',
      'Security',
      'Policy',
      'Science',
      'Media'
    ]
    
    // Create category map with latest update times for standard categories only
    const categoryMap = new Map<string, string>()
    
    // For each standard category, find the latest article update time
    standardCategories.forEach(category => {
      const normalizedCategory = normalizeCategory(category)
      let latestUpdate = currentDate
      
      validArticles.forEach(article => {
        if (article.category) {
          // Check if article's category contains this standard category
           const articleCategories = article.category.split(',').map((cat: string) => normalizeCategory(cat.trim()))
          if (articleCategories.includes(normalizedCategory)) {
            const articleLastMod = normalizeTimestamp(article.updated_at || article.article_published_at)
            if (new Date(articleLastMod) > new Date(latestUpdate)) {
              latestUpdate = articleLastMod
            }
          }
        }
      })
      
      categoryMap.set(normalizedCategory, latestUpdate)
    })
    
    const baseUrl = 'https://www.xarticle.news'
    
    // Core pages with priority structure
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/trending', priority: '0.9', changefreq: 'hourly' },
      { url: '/landing' }
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
${Array.from(categoryMap.entries()).map(([category, lastMod]) => `  <url>
    <loc>${escapeXml(baseUrl + '/category/' + generateCategorySlug(category))}</loc>
    <lastmod>${escapeXml(lastMod)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
${validArticles?.map((article: { slug: string; article_published_at?: string; updated_at?: string }) => `  <url>
    <loc>${escapeXml(baseUrl + '/article/' + encodeURIComponent(article.slug))}</loc>
    <lastmod>${escapeXml(normalizeTimestamp(article.updated_at || article.article_published_at))}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`).join('\n') || ''}
</urlset>`
    
    // Validate sitemap size constraints
    const sitemapSize = Buffer.byteLength(sitemap, 'utf8')
    const urlCount = validArticles.length + categoryMap.size + staticPages.length
    
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
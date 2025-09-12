import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = 'https://www.xarticle.news'
  const currentDate = new Date().toISOString()
  
  const staticPages = [
    // Homepage - both languages
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/zh', priority: '1.0', changefreq: 'daily' },
    { url: '/en', priority: '1.0', changefreq: 'daily' },
    
    // Trending pages
    { url: '/trending', priority: '0.9', changefreq: 'hourly' },
    { url: '/zh/trending', priority: '0.9', changefreq: 'hourly' },
    { url: '/en/trending', priority: '0.9', changefreq: 'hourly' },
    
    // Category pages
    { url: '/category', priority: '0.8', changefreq: 'daily' },
    { url: '/zh/category', priority: '0.8', changefreq: 'daily' },
    { url: '/en/category', priority: '0.8', changefreq: 'daily' },
    
    // Summary pages
    { url: '/summaries', priority: '0.7', changefreq: 'daily' },
    { url: '/summary', priority: '0.7', changefreq: 'daily' },
    
    // Profile and auth pages
    { url: '/profile', priority: '0.6', changefreq: 'weekly' },
    { url: '/login', priority: '0.4', changefreq: 'monthly' },
    { url: '/register', priority: '0.4', changefreq: 'monthly' },
    
    // Legal pages
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
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
}
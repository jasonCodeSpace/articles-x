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
    { url: '/xarticle-daily', priority: '0.7', changefreq: 'daily' },
    { url: '/author/xarticle', priority: '0.7', changefreq: 'daily' },
    
    // Profile and auth pages
    { url: '/profile', priority: '0.6', changefreq: 'weekly' },
    { url: '/login', priority: '0.4', changefreq: 'monthly' },
    { url: '/register', priority: '0.4', changefreq: 'monthly' },
    
    // Legal pages
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <!-- Homepage with multilingual support -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/" />
    <xhtml:link rel="alternate" hreflang="zh" href="${baseUrl}/zh/" />
    <xhtml:link rel="alternate" hreflang="ja" href="${baseUrl}/ja/" />
    <xhtml:link rel="alternate" hreflang="ko" href="${baseUrl}/ko/" />
    <xhtml:link rel="alternate" hreflang="es" href="${baseUrl}/es/" />
    <xhtml:link rel="alternate" hreflang="fr" href="${baseUrl}/fr/" />
    <xhtml:link rel="alternate" hreflang="de" href="${baseUrl}/de/" />
    <xhtml:link rel="alternate" hreflang="it" href="${baseUrl}/it/" />
    <xhtml:link rel="alternate" hreflang="pt" href="${baseUrl}/pt/" />
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/ru/" />
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/ar/" />
    <xhtml:link rel="alternate" hreflang="hi" href="${baseUrl}/hi/" />
    <xhtml:link rel="alternate" hreflang="th" href="${baseUrl}/th/" />
    <xhtml:link rel="alternate" hreflang="vi" href="${baseUrl}/vi/" />
    <xhtml:link rel="alternate" hreflang="tr" href="${baseUrl}/tr/" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/" />
    <xhtml:link rel="alternate" hreflang="nl" href="${baseUrl}/nl/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
  </url>
  
  <!-- English homepage -->
  <url>
    <loc>${baseUrl}/en/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/" />
    <xhtml:link rel="alternate" hreflang="zh" href="${baseUrl}/zh/" />
    <xhtml:link rel="alternate" hreflang="ja" href="${baseUrl}/ja/" />
    <xhtml:link rel="alternate" hreflang="ko" href="${baseUrl}/ko/" />
    <xhtml:link rel="alternate" hreflang="es" href="${baseUrl}/es/" />
    <xhtml:link rel="alternate" hreflang="fr" href="${baseUrl}/fr/" />
    <xhtml:link rel="alternate" hreflang="de" href="${baseUrl}/de/" />
    <xhtml:link rel="alternate" hreflang="it" href="${baseUrl}/it/" />
    <xhtml:link rel="alternate" hreflang="pt" href="${baseUrl}/pt/" />
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/ru/" />
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/ar/" />
    <xhtml:link rel="alternate" hreflang="hi" href="${baseUrl}/hi/" />
    <xhtml:link rel="alternate" hreflang="th" href="${baseUrl}/th/" />
    <xhtml:link rel="alternate" hreflang="vi" href="${baseUrl}/vi/" />
    <xhtml:link rel="alternate" hreflang="tr" href="${baseUrl}/tr/" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/" />
    <xhtml:link rel="alternate" hreflang="nl" href="${baseUrl}/nl/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
  </url>
  
  <!-- Chinese homepage -->
  <url>
    <loc>${baseUrl}/zh/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/" />
    <xhtml:link rel="alternate" hreflang="zh" href="${baseUrl}/zh/" />
    <xhtml:link rel="alternate" hreflang="ja" href="${baseUrl}/ja/" />
    <xhtml:link rel="alternate" hreflang="ko" href="${baseUrl}/ko/" />
    <xhtml:link rel="alternate" hreflang="es" href="${baseUrl}/es/" />
    <xhtml:link rel="alternate" hreflang="fr" href="${baseUrl}/fr/" />
    <xhtml:link rel="alternate" hreflang="de" href="${baseUrl}/de/" />
    <xhtml:link rel="alternate" hreflang="it" href="${baseUrl}/it/" />
    <xhtml:link rel="alternate" hreflang="pt" href="${baseUrl}/pt/" />
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/ru/" />
    <xhtml:link rel="alternate" hreflang="ar" href="${baseUrl}/ar/" />
    <xhtml:link rel="alternate" hreflang="hi" href="${baseUrl}/hi/" />
    <xhtml:link rel="alternate" hreflang="th" href="${baseUrl}/th/" />
    <xhtml:link rel="alternate" hreflang="vi" href="${baseUrl}/vi/" />
    <xhtml:link rel="alternate" hreflang="tr" href="${baseUrl}/tr/" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/" />
    <xhtml:link rel="alternate" hreflang="nl" href="${baseUrl}/nl/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
  </url>
  
  <!-- Trending pages -->
  <url>
    <loc>${baseUrl}/trending</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Category pages -->
  <url>
    <loc>${baseUrl}/category</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Legal pages -->
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>2025-08-30T12:00:00Z</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>2025-08-30T12:00:00Z</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
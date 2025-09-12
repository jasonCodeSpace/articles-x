import { NextResponse } from 'next/server'

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap locations
Sitemap: https://www.xarticle.news/sitemap-index.xml
Sitemap: https://www.xarticle.news/sitemap-static.xml
Sitemap: https://www.xarticle.news/sitemap-categories.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /auth/

# Allow important pages
Allow: /api/og
Allow: /api/sitemap

# Host
Host: https://www.xarticle.news`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
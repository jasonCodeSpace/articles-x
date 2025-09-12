import { NextResponse } from 'next/server'

export async function GET() {
  // Redirect to the new sitemap index structure
  const baseUrl = 'https://www.xarticle.news'
  
  return NextResponse.redirect(`${baseUrl}/sitemap-index.xml`, 301)
}
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { RSSFeed } from '@/lib/rss'

// RSS feed with 1-hour cache
export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch recent articles (last 100)
    const { data: articles, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        title_english,
        slug,
        summary_english,
        summary_chinese,
        full_article_content,
        article_published_at,
        updated_at,
        author_name,
        author_handle,
        article_url,
        language,
        image
      `)
      .not('slug', 'is', null)
      .neq('slug', '')
      .order('article_published_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching articles for RSS:', error)
      return new NextResponse('Error generating RSS feed', { status: 500 })
    }

    const feed = new RSSFeed({
      title: 'Xarticle - Curated Articles from X',
      description: 'Discover the most valuable long-form articles shared on X. AI-curated and summarized for serious readers.',
      feed_url: 'https://www.xarticle.news/rss.xml',
      site_url: 'https://www.xarticle.news',
      language: 'en',
      pubDate: new Date(),
      ttl: 60, // 60 minutes cache
    })

    // Add items to feed
    articles?.forEach((article) => {
      const title = article.title_english || article.title
      const description = article.summary_english || article.summary_chinese ||
        (article.full_article_content ? article.full_article_content.substring(0, 280) + '...' : '')

      feed.addItem({
        title,
        description,
        url: `https://www.xarticle.news/article/${article.slug}`,
        date: article.article_published_at || article.updated_at,
        author: article.author_name,
        guid: `https://www.xarticle.news/article/${article.slug}`,
        categories: article.language === 'zh' ? ['Chinese', '中文'] : ['English'],
        enclosure: article.image ? {
          url: article.image,
          type: 'image/jpeg'
        } : undefined
      })
    })

    const rss = feed.build()

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new NextResponse('Error generating RSS feed', { status: 500 })
  }
}

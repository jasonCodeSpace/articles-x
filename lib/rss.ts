interface RSSFeedOptions {
  title: string
  description: string
  feed_url: string
  site_url: string
  language?: string
  pubDate?: Date
  ttl?: number
  image_url?: string
}

interface RSSItemOptions {
  title: string
  description: string
  url: string
  date?: string | null
  author?: string | null
  guid?: string
  categories?: string[]
  enclosure?: {
    url: string
    type: string
    length?: number
  }
}

export class RSSFeed {
  private options: RSSFeedOptions
  private items: RSSItemOptions[] = []

  constructor(options: RSSFeedOptions) {
    this.options = options
  }

  addItem(item: RSSItemOptions) {
    this.items.push(item)
  }

  build(): string {
    const { title, description, feed_url, site_url, language, pubDate, ttl, image_url } = this.options

    const pubDateStr = pubDate ? pubDate.toUTCString() : new Date().toUTCString()

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${this.escapeXml(title)}</title>
    <description>${this.escapeXml(description)}</description>
    <link>${this.escapeXml(site_url)}</link>
    <atom:link href="${this.escapeXml(feed_url)}" rel="self" type="application/rss+xml"/>
    <language>${language || 'en-us'}</language>
    <lastBuildDate>${pubDateStr}</lastBuildDate>
    <pubDate>${pubDateStr}</pubDate>
    ${ttl ? `<ttl>${ttl}</ttl>` : ''}`

    if (image_url) {
      xml += `
    <image>
      <url>${this.escapeXml(image_url)}</url>
      <title>${this.escapeXml(title)}</title>
      <link>${this.escapeXml(site_url)}</link>
    </image>`
    }

    // Add items
    for (const item of this.items) {
      const itemDate = item.date ? new Date(item.date).toUTCString() : pubDateStr
      const guid = item.guid || item.url

      xml += `
    <item>
      <title>${this.escapeXml(item.title)}</title>
      <description>${this.escapeXml(item.description)}</description>
      <link>${this.escapeXml(item.url)}</link>
      <guid isPermaLink="true">${this.escapeXml(guid)}</guid>
      <pubDate>${itemDate}</pubDate>`

      if (item.author) {
        xml += `
      <author>${this.escapeXml(item.author)}</author>`
      }

      if (item.categories && item.categories.length > 0) {
        for (const category of item.categories) {
          xml += `
      <category>${this.escapeXml(category)}</category>`
        }
      }

      if (item.enclosure) {
        const length = item.enclosure.length || 0
        xml += `
      <enclosure url="${this.escapeXml(item.enclosure.url)}" type="${this.escapeXml(item.enclosure.type)}" length="${length}"/>`
      }

      xml += `
    </item>`
    }

    xml += `
  </channel>
</rss>`

    return xml
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

// Helper to generate RSS for a subset of articles
export function generateRSS(
  articles: Array<{
    title: string
    title_english?: string | null
    slug: string
    summary_english?: string | null
    summary_chinese?: string | null
    full_article_content?: string | null
    article_published_at?: string | null
    updated_at?: string | null
    author_name?: string | null
    author_handle?: string | null
    language?: string | null
    image?: string | null
  }>,
  options?: Partial<RSSFeedOptions>
): string {
  const feed = new RSSFeed({
    title: 'Xarticle - Curated Articles from X',
    description: 'Discover the most valuable long-form articles shared on X. AI-curated and summarized for serious readers.',
    feed_url: 'https://www.xarticle.news/rss.xml',
    site_url: 'https://www.xarticle.news',
    language: 'en',
    pubDate: new Date(),
    ttl: 60,
    ...options
  })

  articles.forEach((article) => {
    const title = article.title_english || article.title
    const description = article.summary_english || article.summary_chinese ||
      (article.full_article_content ? article.full_article_content.substring(0, 280) + '...' : '')

    feed.addItem({
      title,
      description,
      url: `https://www.xarticle.news/article/${article.slug}`,
      date: article.article_published_at || article.updated_at,
      author: article.author_name || article.author_handle || undefined,
      guid: `https://www.xarticle.news/article/${article.slug}`,
      categories: article.language === 'zh' ? ['Chinese', '中文'] : ['English'],
      enclosure: article.image ? {
        url: article.image,
        type: 'image/jpeg'
      } : undefined
    })
  })

  return feed.build()
}

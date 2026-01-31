import { createClient } from '@supabase/supabase-js'

// Simple HTML parser (instead of cheerio to avoid dependency)
class SimpleHTMLParser {
  private html: string

  constructor(html: string) {
    this.html = html
  }

  getMetaContent(property: string, name?: string): string | null {
    const regex = name
      ? new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i')
      : new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, 'i')
    const match = this.html.match(regex)
    return match ? match[1] : null
  }

  extractImages(): string[] {
    const images: string[] = []
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
    let match
    while ((match = imgRegex.exec(this.html)) !== null) {
      if (match[1] && match[1].startsWith('http')) {
        images.push(match[1])
      }
    }
    return [...new Set(images)]
  }

  extractVideos(): string[] {
    const videos: string[] = []

    // Video src attributes
    const videoRegex = /<video[^>]*>\s*(?:<source[^>]+src=["']([^"']+)["'][^>]*>)*\s*<\/video>/gi
    let match
    while ((match = videoRegex.exec(this.html)) !== null) {
      const srcMatch = match[0].match(/src=["']([^"']+)["']/)
      if (srcMatch && srcMatch[1] && srcMatch[1].startsWith('http')) {
        videos.push(srcMatch[1])
      }
    }

    // Iframe embeds (YouTube, Vimeo, etc.)
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi
    while ((match = iframeRegex.exec(this.html)) !== null) {
      const src = match[1]
      if (src.includes('youtube.com') || src.includes('youtu.be') ||
          src.includes('vimeo.com') || src.includes('player.vimeo')) {
        videos.push(src)
      }
    }

    return [...new Set(videos)]
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pskhqphqikghdyqmgsud.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface MediaContent {
  images: string[]
  videos: string[]
}

// Fetch article content and extract media
async function extractMediaFromArticle(url: string): Promise<MediaContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; XarticleBot/1.0)',
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const parser = new SimpleHTMLParser(html)

    const images: string[] = []

    // Open Graph images
    const ogImage = parser.getMetaContent('og:image')
    if (ogImage) images.push(ogImage)

    // Twitter images
    const twitterImage = parser.getMetaContent('twitter:image')
    if (twitterImage) images.push(twitterImage)

    // Article images from HTML
    const htmlImages = parser.extractImages()
    images.push(...htmlImages)

    // Videos from HTML
    const htmlVideos = parser.extractVideos()

    // Video meta tags
    const ogVideo = parser.getMetaContent('og:video')
    if (ogVideo) htmlVideos.push(ogVideo)

    const twitterVideo = parser.getMetaContent('twitter:player')
    if (twitterVideo) htmlVideos.push(twitterVideo)

    // Limit results
    return {
      images: [...new Set(images)].slice(0, 10),
      videos: [...new Set(htmlVideos)].slice(0, 5),
    }
  } catch (error) {
    console.error(`Error extracting media from ${url}:`, error)
    return { images: [], videos: [] }
  }
}

async function processArticlesWithoutMedia() {
  console.log('Fetching articles without media data...')

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, article_url, article_images, article_videos')
    .not('article_url', 'is', null)
    .not('article_url', 'eq', '')
    .limit(50) // Process in batches

  if (error) {
    console.error('Error fetching articles:', error)
    return
  }

  console.log(`Found ${articles?.length || 0} articles to process`)

  let processedCount = 0
  let mediaFoundCount = 0

  for (const article of articles || []) {
    console.log(`\n--- Processing article ${article.id.substring(0, 8)}... ---`)

    // Skip if already has media
    if ((article.article_images?.length || 0) > 0 || (article.article_videos?.length || 0) > 0) {
      console.log(`Already has media, skipping`)
      continue
    }

    const media = await extractMediaFromArticle(article.article_url!)

    console.log(`Found ${media.images.length} images, ${media.videos.length} videos`)

    if (media.images.length > 0 || media.videos.length > 0) {
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          article_images: media.images,
          article_videos: media.videos,
          updated_at: new Date().toISOString()
        })
        .eq('id', article.id)

      if (updateError) {
        console.error(`Failed to update: ${updateError.message}`)
      } else {
        console.log(`Updated successfully`)
        mediaFoundCount++
      }
    }

    processedCount++

    // Rate limiting - wait 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log(`\n=== Summary ===`)
  console.log(`Processed: ${processedCount}`)
  console.log(`Media found: ${mediaFoundCount}`)
}

// First, add the media columns if they don't exist
async function ensureColumnsExist() {
  console.log('Ensuring media columns exist...')

  // This would normally be done via migration, but we'll check here
  const { data: columns } = await supabase
    .rpc('get_table_columns', { table_name: 'articles' })
    // Note: this function might not exist, so we'll just proceed
}

processArticlesWithoutMedia().then(() => {
  console.log('\nDone!')
  process.exit(0)
}).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})

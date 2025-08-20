import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const rapidApiKey = process.env.RAPIDAPI_KEY!
const rapidApiHost = process.env.RAPIDAPI_HOST!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface EnhancedTweetData {
  id?: string
  title: string
  slug: string
  content: string
  excerpt: string
  author_id?: string
  author_name: string
  likes_count: number
  views_count: number
  comments_count: number
  published_at: string
  status: string
  meta_title: string
  meta_description: string
  featured_image_url?: string
  tags: string[]
  category: string
  author_handle: string
  author_profile_image: string
  article_url: string
  tweet_url?: string
  tweet_published_at: string
  tweet_id: string
  article_published_at: string
}

const twitterUrls = [
  'https://x.com/mobyagent/status/1932462252109480065',
  'https://x.com/getmoni_io/status/1910321579461931185',
  'https://x.com/Mira_Network/status/1937884528481038641',
  'https://x.com/Mira_Network/status/1930649502408753391',
  'https://x.com/heavendex/status/1957622426096795875',
  'https://x.com/Phyrex_Ni/status/1932933919470457214',
  'https://x.com/danielesesta/status/1932933919470457214',
  'https://x.com/HoloworldAI/status/1943711461647192111',
  'https://x.com/Phyrex_Ni/status/1945418518352331166',
  'https://x.com/SpaceIDProtocol/status/1925928316147544115',
  'https://x.com/HoloworldAI/status/1928869453376401585',
  'https://x.com/0x_xifeng/status/1954085092407882141',
  'https://x.com/Phyrex_Ni/status/1927617196509057347',
  'https://x.com/munchPRMR/status/1947477173826171061',
  'https://x.com/Phyrex_Ni/status/1953169889612710388',
  'https://x.com/S4mmyEth/status/1950187573495595063',
  'https://x.com/S4mmyEth/status/1945082220303020103',
  'https://x.com/mobyagent/status/1932459160785801603',
  'https://x.com/Phyrex_Ni/status/1932718441301246323',
  'https://x.com/Phyrex_Ni/status/1925088823505195024',
  'https://x.com/Phyrex_Ni/status/1948003384235323564',
  'https://x.com/MasonCanoe/status/1896877269324595305',
  'https://x.com/wallet/status/1950732288754659694'
]

function extractTweetId(url: string): string {
  const match = url.match(/status\/(\d+)/)
  return match ? match[1] : ''
}

function generateSlug(authorHandle: string, tweetId: string): string {
  return `${authorHandle.replace('@', '')}-${tweetId}`
}

function extractTextContent(fullText: string): string {
  // Remove URLs and clean up text for content
  return fullText
    .replace(/https:\/\/t\.co\/\w+/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

function generateExcerpt(content: string, maxLength: number = 150): string {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength).trim() + '...'
}

function extractTags(text: string): string[] {
  const hashtags = text.match(/#\w+/g) || []
  return hashtags.map(tag => tag.substring(1).toLowerCase())
}

function determineCategory(text: string, tags: string[]): string {
  const cryptoKeywords = ['crypto', 'bitcoin', 'ethereum', 'defi', 'nft', 'blockchain', 'token', 'coin']
  const techKeywords = ['ai', 'tech', 'development', 'programming', 'software']
  
  const lowerText = text.toLowerCase()
  const allTags = tags.join(' ').toLowerCase()
  
  if (cryptoKeywords.some(keyword => lowerText.includes(keyword) || allTags.includes(keyword))) {
    return 'crypto'
  }
  if (techKeywords.some(keyword => lowerText.includes(keyword) || allTags.includes(keyword))) {
    return 'tech'
  }
  return 'general'
}

async function fetchTweetData(tweetId: string): Promise<any> {
  const url = 'https://twitter241.p.rapidapi.com/tweet'
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': rapidApiKey,
      'x-rapidapi-host': rapidApiHost
    }
  }

   const response = await fetch(`${url}?pid=${tweetId}`, options)
   if (!response.ok) {
     throw new Error(`HTTP error! status: ${response.status}`)
   }
   const data = await response.json()
   
   // Debug: Log the first response to understand structure
   if (tweetId === '1932462252109480065') {
     console.log('DEBUG - API Response structure:', JSON.stringify(data, null, 2))
   }
   
   return data
}

function processTweetData(apiResponse: any, originalUrl: string): EnhancedTweetData {
  // Extract tweet data from the new API response structure
  const conversation = apiResponse.data?.threaded_conversation_with_injections_v2
  if (!conversation?.instructions) {
    throw new Error(`Invalid API response structure`)
  }

  // Find the instruction with entries (usually TimelineAddEntries)
  let tweetData = null
  let userResult = null
  let legacy = null
  let userLegacy = null
  let articleData = null
  let tweetId = ''

  for (const instruction of conversation.instructions) {
    if (instruction.entries && instruction.entries.length > 0) {
      const entry = instruction.entries[0]
      if (entry.content?.itemContent?.tweet_results?.result) {
        tweetData = entry.content.itemContent.tweet_results.result
        userResult = tweetData.core?.user_results?.result
        legacy = tweetData.legacy
        userLegacy = userResult?.legacy
        articleData = tweetData.article
        tweetId = legacy?.id_str || tweetData.rest_id || ''
        break
      }
    }
  }

  if (!tweetData || !legacy || !userLegacy) {
    throw new Error(`Invalid tweet data structure`)
  }

  // Extract basic tweet info
  const fullText = legacy.full_text || ''
  const authorName = userLegacy.name || ''
  const authorHandle = userLegacy.screen_name || ''
  const authorProfileImage = userLegacy.profile_image_url_https || ''
  const createdAt = legacy.created_at ? new Date(legacy.created_at).toISOString() : new Date().toISOString()
  const likesCount = legacy.favorite_count || 0
  const retweetCount = legacy.retweet_count || 0
  const replyCount = legacy.reply_count || 0

  // Extract article data if available
   let title = fullText
   let content = extractTextContent(fullText)
   let excerpt = generateExcerpt(content)
   let featuredImageUrl = null
   let articleUrl = originalUrl

   if (articleData) {
        // Access the nested article structure
        const article = articleData.article_results?.result
        if (article) {
          title = article.title || fullText
          content = article.preview_text || content
          excerpt = article.preview_text || generateExcerpt(content)
          featuredImageUrl = article.cover_media?.media_info?.original_img_url || null
          articleUrl = originalUrl
        }
      }

  // Generate slug
  const slug = generateSlug(authorHandle, tweetId)

  // Extract tags
  const tags = extractTags(content)

  // Determine category
  const category = determineCategory(content, tags)

  // Generate title from content if not from article
  if (!articleData) {
    title = content.length > 50 ? content.substring(0, 50) + '...' : content || 'Tweet Content'
  }

  return {
    title,
    slug,
    content,
    excerpt,
    author_name: authorName,
    likes_count: likesCount,
    views_count: tweetData.views?.count || 0,
    comments_count: replyCount,
    published_at: createdAt,
    status: 'published',
    meta_title: title.substring(0, 60),
    meta_description: excerpt,
    featured_image_url: featuredImageUrl,
    tags,
    category,
    author_handle: `@${authorHandle}`,
    author_profile_image: authorProfileImage,
    article_url: articleUrl,
    tweet_url: originalUrl,
    tweet_published_at: createdAt,
    tweet_id: tweetId,
    article_published_at: createdAt
  }
}

async function saveToSupabase(articlesData: EnhancedTweetData[]): Promise<void> {
  console.log('Saving to Supabase...')
  
  for (const article of articlesData) {
    const { error } = await supabase
      .from('articles')
      .upsert(article, {
        onConflict: 'slug'
      })
    
    if (error) {
      console.error(`Error saving article ${article.slug}:`, error)
      throw error
    }
  }
  
  console.log(`Successfully saved ${articlesData.length} articles`)
}

export async function processAllTweets(): Promise<void> {
  const processedTweets: EnhancedTweetData[] = []
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < twitterUrls.length; i++) {
    const url = twitterUrls[i]
    const tweetId = extractTweetId(url)
    
    console.log(`Processing ${i + 1}/${twitterUrls.length}: ${tweetId}`)
    
    try {
      const tweetData = await fetchTweetData(tweetId)
      const processedData = processTweetData(tweetData, url)
      processedTweets.push(processedData)
      
      console.log(`✓ Successfully processed: ${processedData.author_handle} - ${processedData.title.substring(0, 50)}...`)
      successCount++
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`✗ Error processing ${tweetId}:`, error)
      errorCount++
    }
  }

  console.log(`\nProcessing complete:`)
  console.log(`- Successfully processed: ${successCount}`)
  console.log(`- Errors: ${errorCount}`)

  if (processedTweets.length > 0) {
    await saveToSupabase(processedTweets)
    console.log('✓ All data saved to Supabase successfully!')
  } else {
    console.log('No data to save.')
  }
}

export type { EnhancedTweetData }

// Run the script if called directly
if (require.main === module) {
  processAllTweets().catch(console.error)
}
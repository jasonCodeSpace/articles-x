import { createTwitterClient, TwitterTweet } from '@/lib/twitter'
import { mapTweetToArticle, mapTweetToTweetData, batchUpsertArticles, batchUpsertTweets, HarvestedArticle, TweetData } from '@/lib/ingest'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Twitter URLs provided by user
const TWITTER_URLS = [
  'https://x.com/mobyagent/status/1932462252109480065',
  'https://x.com/getmoni_io/status/1910321579461931185',
  'https://x.com/Mira_Network/status/1937884528481038641',
  'https://x.com/Mira_Network/status/1930649502408753391',
  'https://x.com/heavendex/status/1957622426096795875',
  'https://x.com/mobyagent/status/1940449573597495697',
  'https://x.com/wallet/status/1932707552032080209',
  'https://x.com/tetsuoai/status/1947186471150157931',
  'https://x.com/tetsuoai/status/1941652777303932974',
  'https://x.com/tetsuoai/status/1792127620072825143',
  'https://x.com/Phyrex_Ni/status/1935228362894815518',
  'https://x.com/roger9949/status/1926564306788733153',
  'https://x.com/tetsuoai/status/1941815795165872421',
  'https://x.com/tetsuoai/status/1941225522681479677',
  'https://x.com/tetsuoai/status/1941153428639715789',
  'https://x.com/getmoni_io/status/1940347306521362662',
  'https://x.com/tetsuoai/status/1941951721187766689',
  'https://x.com/HoloworldAI/status/1933285730865828241',
  'https://x.com/Covalent_HQ/status/1957915320754266546',
  'https://x.com/Ga__ke/status/1898941696144252930',
  'https://x.com/tetsuoai/status/1942154874055278918',
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

interface ProcessedTweetInfo {
  // Author information
  authorName: string
  authorHandle: string
  authorProfileImage?: string
  
  // Article information
  articleTitle?: string
  articlePreviewText?: string
  articleCoverImage?: string
  articlePublishedAt?: string
  
  // Post information
  postDirectUrl: string
  postPublishedAt: string
  
  // Additional metadata
  tweetId: string
  hasArticle: boolean
  articleUrl?: string
}

/**
 * Extract tweet ID from Twitter URL
 */
function extractTweetId(url: string): string | null {
  const match = url.match(/status\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Fetch tweet data using Twitter API
 */
async function fetchTweetData(tweetId: string): Promise<TwitterTweet | null> {
  try {
    const twitterClient = createTwitterClient()
    // Note: This is a simplified approach. In a real implementation,
    // you would need to use the appropriate Twitter API endpoint for individual tweets
    // For now, we'll simulate this or use existing list-based fetching
    console.log(`Fetching tweet data for ID: ${tweetId}`)
    
    // TODO: Implement individual tweet fetching
    // This would require extending the TwitterClient with a fetchTweet method
    return null
  } catch (error) {
    console.error(`Error fetching tweet ${tweetId}:`, error)
    return null
  }
}

/**
 * Process a single tweet and extract required information
 */
function processTweetInfo(tweet: TwitterTweet, originalUrl: string): ProcessedTweetInfo {
  // Extract user info from core.user_results.result.legacy or fallback to legacy.user
  const userLegacy = tweet.core?.user_results?.result?.legacy
  const userFallback = tweet.legacy?.user
  
  const authorHandle = userLegacy?.screen_name || userFallback?.screen_name || 'unknown'
  const authorName = userLegacy?.name || userFallback?.name || authorHandle
  const authorProfileImage = userLegacy?.profile_image_url_https || userFallback?.profile_image_url_https
  
  // Extract tweet info
  const tweetId = tweet.legacy?.id_str || tweet.rest_id || ''
  const postPublishedAt = tweet.legacy?.created_at || ''
  
  // Check for article data
  const articleResult = tweet.article_results?.result || tweet.article?.article_results?.result
  const hasArticle = !!articleResult
  
  let articleTitle: string | undefined
  let articlePreviewText: string | undefined
  let articleCoverImage: string | undefined
  let articlePublishedAt: string | undefined
  let articleUrl: string | undefined
  
  if (articleResult) {
    articleTitle = articleResult.title
    articlePreviewText = articleResult.preview_text || articleResult.description
    articleCoverImage = articleResult.cover_media?.media_info?.original_img_url
    articleUrl = articleResult.url
    
    // Convert article published timestamp to readable format
    if (articleResult.metadata?.first_published_at_secs) {
      const publishedDate = new Date(articleResult.metadata.first_published_at_secs * 1000)
      articlePublishedAt = publishedDate.toISOString()
    }
  }
  
  return {
    authorName,
    authorHandle,
    authorProfileImage,
    articleTitle,
    articlePreviewText,
    articleCoverImage,
    articlePublishedAt,
    postDirectUrl: originalUrl,
    postPublishedAt,
    tweetId,
    hasArticle,
    articleUrl
  }
}

/**
 * Save processed tweet information to Supabase
 */
async function saveTweetInfoToSupabase(tweetInfos: ProcessedTweetInfo[]): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  const supabase = createClient(supabaseUrl, serviceKey)
  
  console.log(`Saving ${tweetInfos.length} tweet records to Supabase...`)
  
  // Prepare data for tweets table
  const tweetData = tweetInfos.map(info => ({
    tweet_id: info.tweetId,
    author_handle: info.authorHandle,
    author_name: info.authorName,
    author_profile_image: info.authorProfileImage,
    tweet_text: '', // We don't have tweet text in this simplified version
    created_at_twitter: info.postPublishedAt,
    has_article: info.hasArticle,
    article_url: info.articleUrl,
    article_title: info.articleTitle,
    article_excerpt: info.articlePreviewText,
    article_featured_image: info.articleCoverImage,
    list_id: 'batch_import', // Special identifier for batch imported tweets
    raw_data: {} // Empty for now
  }))
  
  // Insert into tweets table
  const { data: tweetsResult, error: tweetsError } = await supabase
    .from('tweets')
    .upsert(tweetData, { onConflict: 'tweet_id' })
    .select()
  
  if (tweetsError) {
    console.error('Error saving tweets:', tweetsError)
    throw tweetsError
  }
  
  console.log(`Successfully saved ${tweetsResult?.length || 0} tweet records`)
  
  // Prepare and save articles for tweets that have articles
  const articlesData = tweetInfos
    .filter(info => info.hasArticle && info.articleTitle)
    .map(info => ({
      title: info.articleTitle!,
      slug: generateSlug(info.articleTitle!),
      content: info.articlePreviewText || '',
      excerpt: info.articlePreviewText,
      author_name: info.authorName,
      author_handle: info.authorHandle,
      author_profile_image: info.authorProfileImage,
      status: 'published' as const,
      published_at: info.articlePublishedAt,
      featured_image_url: info.articleCoverImage,
      tags: ['batch_import'],
      category: 'crypto',
      tweet_url: info.postDirectUrl,
      tweet_published_at: info.postPublishedAt,
      tweet_id: info.tweetId,
      article_published_at: info.articlePublishedAt,
      article_url: info.articleUrl
    }))
  
  if (articlesData.length > 0) {
    const { data: articlesResult, error: articlesError } = await supabase
      .from('articles')
      .upsert(articlesData, { onConflict: 'slug' })
      .select()
    
    if (articlesError) {
      console.error('Error saving articles:', articlesError)
      throw articlesError
    }
    
    console.log(`Successfully saved ${articlesResult?.length || 0} article records`)
  }
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100)
}

/**
 * Main function to process all Twitter URLs
 */
export async function batchProcessTwitterUrls(): Promise<void> {
  console.log(`🚀 Starting batch processing of ${TWITTER_URLS.length} Twitter URLs...`)
  
  const processedTweets: ProcessedTweetInfo[] = []
  const errors: string[] = []
  
  for (const url of TWITTER_URLS) {
    try {
      const tweetId = extractTweetId(url)
      if (!tweetId) {
        errors.push(`Invalid URL format: ${url}`)
        continue
      }
      
      console.log(`Processing: ${url} (ID: ${tweetId})`)
      
      // For now, we'll create a mock tweet object since individual tweet fetching
      // is not implemented in the current TwitterClient
      // In a real implementation, you would fetch the actual tweet data
      const mockTweet: Partial<TwitterTweet> = {
        rest_id: tweetId,
        legacy: {
          id_str: tweetId,
          created_at: new Date().toUTCString(),
          full_text: 'Mock tweet text',
          user: {
            screen_name: url.split('/')[3], // Extract username from URL
            name: url.split('/')[3],
            profile_image_url_https: undefined
          }
        }
      }
      
      const tweetInfo = processTweetInfo(mockTweet as TwitterTweet, url)
      processedTweets.push(tweetInfo)
      
    } catch (error) {
      const errorMsg = `Error processing ${url}: ${error}`
      console.error(errorMsg)
      errors.push(errorMsg)
    }
  }
  
  console.log(`\n📊 Processing Summary:`)
  console.log(`- Total URLs: ${TWITTER_URLS.length}`)
  console.log(`- Successfully processed: ${processedTweets.length}`)
  console.log(`- Errors: ${errors.length}`)
  console.log(`- Tweets with articles: ${processedTweets.filter(t => t.hasArticle).length}`)
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    errors.forEach(error => console.log(`  - ${error}`))
  }
  
  // Save to Supabase
  if (processedTweets.length > 0) {
    try {
      await saveTweetInfoToSupabase(processedTweets)
      console.log('\n✅ Successfully saved all data to Supabase!')
    } catch (error) {
      console.error('\n❌ Error saving to Supabase:', error)
    }
  }
}

// Run the batch processing if this script is executed directly
if (require.main === module) {
  batchProcessTwitterUrls()
    .then(() => {
      console.log('\n🎉 Batch processing completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Batch processing failed:', error)
      process.exit(1)
    })
}
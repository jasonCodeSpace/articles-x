import { config } from 'dotenv'
import path from 'path'
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!RAPIDAPI_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface ExtractedData {
  authorName: string
  authorHandle: string
  authorProfileImage: string
  articleTitle: string
  previewText: string
  featuredImageUrl: string
  createdAt: string
  tweetId: string
  tweetUrl: string
}

async function getTweetData(tweetId: string): Promise<any> {
  try {
    const response = await fetch(`https://twitter241.p.rapidapi.com/tweet?pid=${tweetId}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'twitter241.p.rapidapi.com'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching tweet data:', error)
    return null
  }
}

function extractRealDataFromTweet(apiResponse: any): ExtractedData | null {
  try {
    // Check if this is the correct API response structure
    if (!apiResponse || typeof apiResponse !== 'object') {
      console.log('Invalid API response structure')
      return null
    }
    
    // Extract tweet data from the API response structure
    const conversation = apiResponse.data?.threaded_conversation_with_injections_v2
    if (!conversation?.instructions) {
      console.log('Invalid API response structure - no conversation data')
      return null
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
      console.log('Could not find valid tweet data in API response')
      return null
    }
    
    // Extract author information
    const authorName = userLegacy.name || 'Unknown Author'
    const authorHandle = userLegacy.screen_name || 'unknown'
    const authorProfileImage = userLegacy.profile_image_url_https || ''
    
    // Extract article information
    const articleTitle = articleData?.article_results?.result?.title || `Article by ${authorName}`
    const previewText = articleData?.article_results?.result?.preview_text || 'Content not available'
    
    // Extract featured image
    const featuredImageUrl = articleData?.article_results?.result?.cover_media?.media_info?.original_img_url || ''
    
    // Extract tweet metadata
    const tweetUrl = tweetId && authorHandle ? `https://x.com/${authorHandle}/status/${tweetId}` : ''
    const createdAt = legacy.created_at || new Date().toISOString()
    
    return {
      authorName,
      authorHandle,
      authorProfileImage,
      articleTitle,
      previewText,
      featuredImageUrl,
      createdAt,
      tweetId,
      tweetUrl
    }
  } catch (error) {
    console.error('Error extracting data from tweet:', error)
    return null
  }
}

function generateSlug(title: string, authorHandle: string, tweetId: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 40)
    .replace(/-$/, '')
  
  return `${baseSlug}-${authorHandle}-${tweetId}`
}

function extractTextContent(text: string): string {
  return text.replace(/https:\/\/t\.co\/\w+/g, '').trim()
}

function generateExcerpt(content: string): string {
  const cleanContent = extractTextContent(content)
  return cleanContent.length > 200 ? cleanContent.substring(0, 200) + '...' : cleanContent
}

function extractTags(content: string): string[] {
  const hashtagMatches = content.match(/#\w+/g)
  const hashtags = hashtagMatches ? hashtagMatches.map(tag => tag.substring(1).toLowerCase()) : []
  
  const keywordTags: string[] = []
  const lowerContent = content.toLowerCase()
  
  const keywords = [
    'ai', 'artificial intelligence', 'machine learning', 'deep learning',
    'blockchain', 'crypto', 'bitcoin', 'ethereum', 'web3', 'defi',
    'programming', 'coding', 'javascript', 'python', 'react', 'nodejs',
    'startup', 'tech', 'innovation', 'digital transformation'
  ]
  
  keywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      keywordTags.push(keyword.replace(/\s+/g, '-'))
    }
  })
  
  return [...new Set([...hashtags, ...keywordTags])].slice(0, 5)
}

function determineCategory(content: string, tags: string[]): string {
  const lowerContent = content.toLowerCase()
  
  if (tags.some(tag => ['ai', 'artificial-intelligence', 'machine-learning', 'deep-learning'].includes(tag)) ||
      lowerContent.includes('ai') || lowerContent.includes('artificial intelligence')) {
    return 'ai'
  }
  
  if (tags.some(tag => ['blockchain', 'crypto', 'bitcoin', 'ethereum', 'web3', 'defi'].includes(tag)) ||
      lowerContent.includes('blockchain') || lowerContent.includes('crypto')) {
    return 'blockchain'
  }
  
  if (tags.some(tag => ['programming', 'coding', 'javascript', 'python', 'react', 'nodejs'].includes(tag)) ||
      lowerContent.includes('programming') || lowerContent.includes('coding')) {
    return 'programming'
  }
  
  return 'insights'
}

async function updateArticleInSupabase(articleId: string, extractedData: ExtractedData): Promise<boolean> {
  try {
    const slug = generateSlug(extractedData.articleTitle, extractedData.authorHandle, extractedData.tweetId)
    const tags = extractTags(extractedData.previewText)
    const category = determineCategory(extractedData.previewText, tags)
    const excerpt = generateExcerpt(extractedData.previewText)
    
    const updateData = {
      title: extractedData.articleTitle,
      slug: slug,
      content: extractedData.previewText,
      excerpt: excerpt,
      author_name: extractedData.authorName,
      author_handle: extractedData.authorHandle,
      author_profile_image: extractedData.authorProfileImage,
      featured_image_url: extractedData.featuredImageUrl || null,
      published_at: extractedData.createdAt,
      category: category,
      tags: tags,
      meta_description: extractedData.previewText.substring(0, 200),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', articleId)
      .select()
    
    if (error) {
      console.error('Error updating article in Supabase:', error)
      return false
    }
    
    console.log('Successfully updated article:', data?.[0]?.title)
    return true
  } catch (error) {
    console.error('Error in updateArticleInSupabase:', error)
    return false
  }
}

async function updateTcoArticles() {
  console.log('Fetching articles with t.co links...')
  
  // Get all articles with t.co links
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, content, author_handle, tweet_id')
    .or('content.like.%https://t.co/%,title.like.%https://t.co/%')
  
  if (error) {
    console.error('Error fetching articles:', error)
    return
  }
  
  if (!articles || articles.length === 0) {
    console.log('No articles with t.co links found')
    return
  }
  
  console.log(`Found ${articles.length} articles to update`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    console.log(`\nProcessing ${i + 1}/${articles.length}: ${article.author_handle} - ${article.tweet_id}`)
    
    try {
      // Get fresh tweet data
      const apiResponse = await getTweetData(article.tweet_id)
      if (!apiResponse) {
        console.log('Failed to get API response')
        errorCount++
        continue
      }
      
      // Extract real data
      const extractedData = extractRealDataFromTweet(apiResponse)
      if (!extractedData) {
        console.log('Failed to extract data')
        errorCount++
        continue
      }
      
      // Check if we actually got better data
      if (extractedData.articleTitle.includes('t.co') || extractedData.previewText.includes('t.co')) {
        console.log('Still getting t.co links, skipping...')
        errorCount++
        continue
      }
      
      console.log('Extracted:', {
        title: extractedData.articleTitle.substring(0, 50) + '...',
        hasContent: extractedData.previewText.length > 50,
        hasImage: !!extractedData.featuredImageUrl
      })
      
      // Update the article
      const updated = await updateArticleInSupabase(article.id, extractedData)
      if (updated) {
        successCount++
        console.log('✅ Successfully updated')
      } else {
        errorCount++
        console.log('❌ Failed to update')
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
      
    } catch (error) {
      console.error('Error processing article:', error)
      errorCount++
    }
  }
  
  console.log('\n=== Update Complete ===')
  console.log(`Successfully updated: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Total: ${articles.length}`)
}

updateTcoArticles().catch(console.error)
import { config } from 'dotenv'
import path from 'path'
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST

if (!RAPIDAPI_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RAPIDAPI_HOST) {
  console.error('Missing required environment variables')
  console.log('SUPABASE_URL:', !!SUPABASE_URL)
  console.log('SUPABASE_SERVICE_KEY:', !!SUPABASE_SERVICE_KEY)
  console.log('RAPIDAPI_KEY:', !!RAPIDAPI_KEY)
  console.log('RAPIDAPI_HOST:', !!RAPIDAPI_HOST)
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY!)

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
    
    console.log('Extracted data overview:', {
      authorName,
      authorHandle,
      articleTitle,
      hasPreviewText: !!previewText,
      hasFeaturedImage: !!featuredImageUrl,
      hasCreatedAt: !!createdAt,
      tweetId
    })
    
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

function extractTweetId(url: string): string | null {
  const match = url.match(/\/status\/(\d+)/)
  return match ? match[1] : null
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

async function saveToSupabase(extractedData: ExtractedData): Promise<boolean> {
  try {
    const slug = generateSlug(extractedData.articleTitle, extractedData.authorHandle, extractedData.tweetId)
    const tags = extractTags(extractedData.previewText)
    const category = determineCategory(extractedData.previewText, tags)
    const excerpt = generateExcerpt(extractedData.previewText)
    
    const articleData = {
      title: extractedData.articleTitle,
      slug: slug,
      content: extractedData.previewText,
      excerpt: excerpt,
      author_name: extractedData.authorName,
      author_handle: extractedData.authorHandle,
      author_profile_image: extractedData.authorProfileImage,
      featured_image_url: extractedData.featuredImageUrl || null,
      published_at: extractedData.createdAt,
      tweet_id: extractedData.tweetId,
      tweet_url: extractedData.tweetUrl,
      category: category,
      tags: tags,
      meta_description: extractedData.previewText.substring(0, 200),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('articles')
      .insert([articleData])
      .select()
    
    if (error) {
      console.error('Error saving to Supabase:', error)
      return false
    }
    
    console.log('Successfully saved article:', data?.[0]?.title)
    return true
  } catch (error) {
    console.error('Error in saveToSupabase:', error)
    return false
  }
}

async function processNewTweet() {
  // Test with the missed tweet
  const tweetUrl = 'https://x.com/wallet/status/1950732288754659694'
  const tweetId = extractTweetId(tweetUrl)
  
  if (!tweetId) {
    console.log('Invalid tweet URL')
    return
  }
  
  console.log(`Processing tweet: ${tweetUrl}`)
  console.log(`Tweet ID: ${tweetId}`)
  
  // Check if article already exists
  const { data: existingArticle } = await supabase
    .from('articles')
    .select('id')
    .eq('tweet_id', tweetId)
    .single()
  
  if (existingArticle) {
    console.log('Article already exists, deleting to test new extraction...')
    await supabase
      .from('articles')
      .delete()
      .eq('tweet_id', tweetId)
  }
  
  const apiResponse = await getTweetData(tweetId)
  if (!apiResponse) {
    console.log('Failed to get API response')
    return
  }
  
  const extractedData = extractRealDataFromTweet(apiResponse)
  if (!extractedData) {
    console.log('Failed to extract data')
    return
  }
  
  console.log('Final extracted data:', extractedData)
  
  const saved = await saveToSupabase(extractedData)
  if (saved) {
    console.log('Successfully processed and saved tweet!')
  } else {
    console.log('Failed to save tweet')
  }
}

processNewTweet().catch(console.error)
import { config } from 'dotenv'
import path from 'path'
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!RAPIDAPI_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables')
  console.error('RAPIDAPI_KEY:', !!RAPIDAPI_KEY)
  console.error('SUPABASE_URL:', !!SUPABASE_URL)
  console.error('SUPABASE_ANON_KEY:', !!SUPABASE_ANON_KEY)
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
    console.log('API Response keys:', Object.keys(apiResponse || {}))
    
    // Check if this is the correct API response structure
    if (!apiResponse || typeof apiResponse !== 'object') {
      console.log('Invalid API response structure')
      return null
    }
    
    // Log the structure to understand what we're getting
    if (apiResponse.data) {
      console.log('Data keys:', Object.keys(apiResponse.data))
    }
    
    // Extract tweet data from the API response structure
    const conversation = apiResponse.data?.threaded_conversation_with_injections_v2
    if (!conversation?.instructions) {
      console.log('Invalid API response structure - no conversation data')
      console.log('Available data structure:', JSON.stringify(apiResponse, null, 2).substring(0, 1000))
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

async function testSingleTweet() {
  // Test with a tweet that should have article data
  const tweetUrl = 'https://x.com/tetsuoai/status/1957382250808705362'
  const tweetId = tweetUrl.split('/').pop()!
  
  console.log(`Testing tweet: ${tweetUrl}`)
  console.log(`Tweet ID: ${tweetId}`)
  
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
}

testSingleTweet().catch(console.error)
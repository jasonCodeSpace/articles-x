import { config } from 'dotenv'
import path from 'path'
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RAPIDAPI_KEY) {
  console.error('Missing required environment variables')
  console.log('SUPABASE_URL:', !!SUPABASE_URL)
  console.log('SUPABASE_SERVICE_KEY:', !!SUPABASE_SERVICE_KEY)
  console.log('RAPIDAPI_KEY:', !!RAPIDAPI_KEY)
  process.exit(1)
}

// Initialize Supabase client with service role key to bypass RLS
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

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

// 新推文链接列表
const newTweetUrls = [
  'https://x.com/wallet/status/1950732288754659694',
  'https://x.com/BitBenderBrink/status/1957733363604672844',
  'https://x.com/X/status/1953897610806206947',
  'https://x.com/0x_xifeng/status/1943486018776338533',
  'https://x.com/X/status/1956416921017966887',
  'https://x.com/MiyaHedge/status/1949475904159093081',
  'https://x.com/buidlpad/status/1957960911463018625',
  'https://x.com/Mira_Network/status/1953405002996662421',
  'https://x.com/tetsuoai/status/1957382250808705362',
  'https://x.com/S4mmyEth/status/1955275653072183370',
  'https://x.com/0x_xifeng/status/1955793637704654877',
  'https://x.com/sadd_asd77675/status/1894515832098861489',
  'https://x.com/jsuarez5341/status/1943692998975402064',
  'https://x.com/Phyrex_Ni/status/1937809368051015730',
  'https://x.com/KayTheDoc/status/1957021509010231394',
  'https://x.com/CowellCrypto/status/1942949869909311996',
  'https://x.com/wallet/status/1927725379135136235',
  'https://x.com/AndreCronjeTech/status/1890754309005935045',
  'https://x.com/Phyrex_Ni/status/1955628720024387980',
  'https://x.com/CowellCrypto/status/1938531812738830627',
  'https://x.com/tetsuoai/status/1955028490979623390',
  'https://x.com/0x_xifeng/status/1954700962821709990',
  'https://x.com/HoloworldAI/status/1948449609711583327',
  'https://x.com/HoloworldAI/status/1954245156649222462',
  'https://x.com/tetsuoai/status/1955023069048869043',
  'https://x.com/lucas_faster/status/1918307973086265760',
  'https://x.com/S4mmyEth/status/1957850622557901123',
  'https://x.com/scattering_io/status/1943237957055389892',
  'https://x.com/Ethereum_OS/status/1957854061975204225',
  'https://x.com/balajis/status/1929557752713822686',
  'https://x.com/X/status/1948830753976201298',
  'https://x.com/X/status/1936137666443329694',
  'https://x.com/X/status/1943747681416827253',
  'https://x.com/maverick23NFT/status/1957772943397957699',
  'https://x.com/X/status/1941224644754702675',
  'https://x.com/X/status/1938681985666355485',
  'https://x.com/X/status/1946290389540827319',
  'https://x.com/X/status/1951355118068113461',
  'https://x.com/Rugcheckxyz/status/1900552758064714218',
  'https://x.com/lucas_faster/status/1914284230450024887',
  'https://x.com/sadd_asd77675/status/1896026368133251348',
  'https://x.com/Rugcheckxyz/status/1901661150330405342',
  'https://x.com/S4mmyEth/status/1945082220303020103',
  'https://x.com/lucas_faster/status/1919348617154101588',
  'https://x.com/danielesesta/status/1904490777549365738',
  'https://x.com/off_thetarget/status/1910550872679211277',
  'https://x.com/danielesesta/status/1907440905386107240',
  'https://x.com/danielesesta/status/1916116056877289686',
  'https://x.com/tmccorp_project/status/1912050351026614740',
  'https://x.com/Cobratate/status/1957729985151529066',
  'https://x.com/StalkHQ/status/1953835211709390859',
  'https://x.com/danielesesta/status/1923029258852597853',
  'http://x.com/Mira_Network/status/1909557534689485230',
  'https://x.com/getmoni_io/status/1899472362791129255',
  'https://x.com/0xSunNFT/status/1869976608981061987'
]

function extractTweetId(url: string): string {
  const match = url.match(/status\/(\d+)/)
  return match ? match[1] : ''
}

function generateSlug(title: string, tweetId: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)
  
  return `${baseSlug}-${tweetId}`
}

function extractTextContent(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, ' ')
    .trim()
}

function generateExcerpt(content: string, maxLength: number = 200): string {
  const cleanContent = extractTextContent(content)
  return cleanContent.length > maxLength 
    ? cleanContent.substring(0, maxLength) + '...'
    : cleanContent
}

function extractTags(content: string): string[] {
  const hashtagMatches = content.match(/#\w+/g) || []
  const hashtags = hashtagMatches.map(tag => tag.substring(1).toLowerCase())
  
  const defaultTags = ['insights', 'digital-age']
  const allTags = [...new Set([...hashtags, ...defaultTags])]
  
  return allTags.slice(0, 5)
}

function determineCategory(content: string, authorHandle: string): string {
  const lowerContent = content.toLowerCase()
  const lowerHandle = authorHandle.toLowerCase()
  
  if (lowerContent.includes('ai') || lowerContent.includes('artificial intelligence') || 
      lowerContent.includes('machine learning') || lowerHandle.includes('ai')) {
    return 'ai'
  }
  
  if (lowerContent.includes('crypto') || lowerContent.includes('blockchain') || 
      lowerContent.includes('defi') || lowerContent.includes('bitcoin') || 
      lowerContent.includes('ethereum')) {
    return 'crypto'
  }
  
  if (lowerContent.includes('tech') || lowerContent.includes('technology') || 
      lowerContent.includes('software') || lowerContent.includes('development')) {
    return 'technology'
  }
  
  return 'general'
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

async function saveToSupabase(extractedData: ExtractedData): Promise<boolean> {
  try {
    const slug = generateSlug(extractedData.articleTitle, extractedData.tweetId)
    const content = extractedData.previewText
    const excerpt = generateExcerpt(content)
    const tags = extractTags(content)
    const category = determineCategory(content, extractedData.authorHandle)
    
    const articleData = {
      title: extractedData.articleTitle,
      slug: slug,
      content: content,
      excerpt: excerpt,
      author_name: extractedData.authorName,
      author_handle: extractedData.authorHandle,
      author_profile_image: extractedData.authorProfileImage,
      featured_image_url: extractedData.featuredImageUrl,
      article_url: extractedData.tweetUrl,
      tweet_url: extractedData.tweetUrl,
      tweet_id: extractedData.tweetId,
      tweet_published_at: extractedData.createdAt,
      article_published_at: extractedData.createdAt,
      published_at: extractedData.createdAt,
      status: 'published',
      meta_title: extractedData.articleTitle,
      meta_description: extractedData.previewText.substring(0, 200),
      tags: tags,
      category: category,
      likes_count: 0,
      views_count: 0,
      comments_count: 0,
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

    console.log(`Successfully saved article: ${extractedData.articleTitle}`)
    return true
  } catch (error) {
    console.error('Error in saveToSupabase:', error)
    return false
  }
}

async function processNewTweets() {
  console.log(`Starting to process ${newTweetUrls.length} new tweets...`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < newTweetUrls.length; i++) {
    const url = newTweetUrls[i]
    const tweetId = extractTweetId(url)
    
    console.log(`\nProcessing ${i + 1}/${newTweetUrls.length}: ${url}`)
    
    if (!tweetId) {
      console.log('Could not extract tweet ID from URL')
      errorCount++
      continue
    }
    
    try {
      // 检查是否已存在
      const { data: existingArticle } = await supabase
        .from('articles')
        .select('id')
        .eq('tweet_id', tweetId)
        .single()
      
      if (existingArticle) {
        console.log(`Article already exists for tweet ${tweetId}, skipping...`)
        continue
      }
      
      // 获取推文数据
      const apiResponse = await getTweetData(tweetId)
      const extractedData = extractRealDataFromTweet(apiResponse)
      
      if (!extractedData) {
        console.log(`Failed to extract data for tweet ${tweetId}`)
        errorCount++
        continue
      }
      
      console.log(`Extracted data overview:`, {
        authorName: extractedData.authorName,
        authorHandle: extractedData.authorHandle,
        articleTitle: extractedData.articleTitle,
        hasPreviewText: !!extractedData.previewText,
        hasFeaturedImage: !!extractedData.featuredImageUrl,
        hasCreatedAt: !!extractedData.createdAt,
        tweetId: extractedData.tweetId
      })
      
      // 保存到数据库
      const saved = await saveToSupabase(extractedData)
      
      if (saved) {
        successCount++
        console.log(`✅ Successfully processed tweet ${tweetId}`)
      } else {
        errorCount++
        console.log(`❌ Failed to save tweet ${tweetId}`)
      }
      
    } catch (error) {
      console.error(`Error processing tweet ${tweetId}:`, error)
      errorCount++
    }
    
    // 速率限制
    if (i < newTweetUrls.length - 1) {
      console.log('Waiting 0.2 seconds before next request...')
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  console.log(`\n=== Processing Complete ===`)
  console.log(`Successfully processed: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Total: ${newTweetUrls.length}`)
}

// 运行脚本
processNewTweets().catch(console.error)
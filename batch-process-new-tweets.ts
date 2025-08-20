import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
// import fetch from 'node-fetch' // Using built-in fetch

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const rapidApiKey = process.env.RAPIDAPI_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Tweet URLs to process
const tweetUrls = [
  'https://x.com/S4mmyEth/status/1955275653072183370',
  'https://x.com/getmoni_io/status/1903421704585540095',
  'https://x.com/getmoni_io/status/1915451012480933959',
  'https://x.com/cryptofishx/status/1957795134806061297',
  'https://x.com/Rugcheckxyz/status/1910029210602897735',
  'https://x.com/Mira_Network/status/1915054541214556551',
  'https://x.com/FinanzasArgy/status/1957823643917902200',
  'https://x.com/Teslarati/status/1957855387266478467',
  'https://x.com/yoheinakajima/status/1865196403171131795',
  'https://x.com/S4mmyEth/status/1895172904490332654',
  'https://x.com/S4mmyEth/status/1947681091877282151',
  'https://x.com/Mira_Network/status/1912527377617268903',
  'https://x.com/BasedMikeLee/status/1957672973080613203',
  'https://x.com/getmoni_io/status/1897209530536124869',
  'https://x.com/StalkHQ/status/1922595174393250216',
  'https://x.com/Mira_Network/status/1907450036675600589',
  'https://x.com/StalkHQ/status/1915913489995980923',
  'https://x.com/StalkHQ/status/1916852870504136709',
  'https://x.com/TrumpWarRoom/status/1953124402742038826',
  'https://x.com/iamcoachcrypto/status/1828058169131557120',
  'https://x.com/Breaking911/status/1957605453887856788',
  'https://x.com/Luyaoyuan1/status/1871867581461913856',
  'https://x.com/StalkHQ/status/1918055448164393186',
  'https://x.com/Luyaoyuan1/status/1853391764192924083',
  'https://x.com/GordoLeyes/status/1957637661276950625',
  'https://x.com/CryptoEights/status/1914898489190096948',
  'https://x.com/CryptoEights/status/1921575591725379899',
  'https://x.com/Luyaoyuan1/status/1866839363612709143',
  'https://x.com/GordoLeyes/status/1957887406830391658',
  'https://x.com/GordoLeyes/status/1957889945378369997',
  'https://x.com/getmoni_io/status/1901974133564653959',
  'https://x.com/splinter0n/status/1957780518646477045',
  'https://x.com/Infinit_Labs/status/1957745575623119069',
  'https://x.com/crypthoem/status/1957918546249564609',
  'https://x.com/Emperor_coinsol/status/1957901779712241994',
  'https://x.com/etherfi_VC/status/1957926413820100834',
  'https://x.com/SlayStupidity/status/1957923613895717083',
  'https://x.com/BankQuote_DAG/status/1957475642364002663',
  'https://x.com/VALORANTBrasil/status/1957804279537840262',
  'https://x.com/FinanzasArgy/status/1957915295609168108',
  'https://x.com/RNCResearch/status/1957900527699734715',
  'https://x.com/EkoLovesYou/status/1957585068496679430',
  'https://x.com/MoonbeamNetwork/status/1957504899534524447',
  'https://x.com/cysic_xyz/status/1957505608351117612',
  'https://x.com/SuhailKakar/status/1957708281423729055',
  'https://x.com/realyanxin/status/1957448740794441901',
  'https://x.com/Cheshire_Cap/status/1957466976067928131',
  'https://x.com/Habbo/status/1957724551191601312',
  'https://x.com/RelayProtocol/status/1957499125051654374',
  'https://x.com/boundless_xyz/status/1957498468093587905',
  'https://x.com/SunriseLayer/status/1957559574472626294',
  'https://x.com/Cobratate/status/1957403380026155308',
  'https://x.com/playsomo/status/1957433308519989713',
  'https://x.com/Teslarati/status/1957602834759012415',
  'https://x.com/1CryptoMama/status/1957362806967464410',
  'https://x.com/Teslarati/status/1957367091331522633',
  'https://x.com/Teslarati/status/1957375210816237996',
  'https://x.com/Teslarati/status/1957463875642650766',
  'https://x.com/Teslarati/status/1957412278980272131',
  'https://x.com/Teslarati/status/1957371458168250624',
  'https://x.com/FinanzasArgy/status/1957405848965124449',
  'https://x.com/clarincom/status/1957407200407613844',
  'https://x.com/2lambro/status/1957290122980028843'
]

function extractTweetId(url: string): string {
  const match = url.match(/status\/(\d+)/)
  return match ? match[1] : ''
}

function extractUsername(url: string): string {
  const match = url.match(/x\.com\/([^/]+)\/status/)
  return match ? match[1] : ''
}

function categorizeContent(text: string, username: string): string {
  const lowerText = text.toLowerCase()
  const lowerUsername = username.toLowerCase()
  
  // Check for crypto/blockchain keywords
  const cryptoKeywords = ['crypto', 'blockchain', 'bitcoin', 'ethereum', 'defi', 'nft', 'token', 'coin', 'wallet', 'trading', 'yield', 'staking', 'dao', 'web3', 'dapp', 'smart contract', 'liquidity', 'airdrop', 'mining', 'hodl', 'bull', 'bear', 'pump', 'dump', 'altcoin', 'memecoin', 'solana', 'polygon', 'avalanche', 'cardano', 'polkadot', 'chainlink', 'uniswap', 'opensea', 'metamask']
  
  // Check for AI keywords
  const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural network', 'gpt', 'llm', 'chatgpt', 'openai', 'anthropic', 'claude', 'model', 'training', 'inference', 'algorithm', 'automation', 'robotics', 'computer vision', 'nlp', 'natural language processing']
  
  // Check for tech keywords
  const techKeywords = ['tech', 'technology', 'software', 'programming', 'coding', 'development', 'api', 'database', 'cloud', 'aws', 'azure', 'google cloud', 'kubernetes', 'docker', 'microservices', 'frontend', 'backend', 'fullstack', 'javascript', 'python', 'react', 'node.js', 'typescript', 'github', 'open source']
  
  if (cryptoKeywords.some(keyword => lowerText.includes(keyword) || lowerUsername.includes(keyword))) {
    return 'crypto'
  }
  
  if (aiKeywords.some(keyword => lowerText.includes(keyword) || lowerUsername.includes(keyword))) {
    return 'ai'
  }
  
  if (techKeywords.some(keyword => lowerText.includes(keyword) || lowerUsername.includes(keyword))) {
    return 'tech'
  }
  
  return 'general'
}

function extractTags(text: string): string[] {
  const hashtags = text.match(/#\w+/g) || []
  return hashtags.map(tag => tag.substring(1).toLowerCase())
}

function generateSlug(title: string, tweetId: string): string {
  if (!title || title.startsWith('http')) {
    return `tweet-${tweetId}`
  }
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50) + `-${tweetId}`
}

async function fetchTweetData(tweetId: string) {
  const url = 'https://twitter-api45.p.rapidapi.com/tweet.php'
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': rapidApiKey,
      'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
    }
  }

  try {
    const response = await fetch(`${url}?id=${tweetId}`, options)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching tweet ${tweetId}:`, error)
    return null
  }
}

function processTweetData(data: any, tweetId: string, username: string) {
  try {
    // Handle the new simplified API response structure
    if (!data || !data.author) {
      console.log('Invalid tweet data structure')
      return null
    }

    // Extract basic tweet information
    const tweetText = data.text || ''
    const authorName = data.author.name || username
    const authorHandle = `@${data.author.screen_name || username}`
    const createdAt = new Date(data.created_at).toISOString()
    
    // Extract media URLs
    const mediaUrls: string[] = []
    if (data.media && Array.isArray(data.media)) {
      for (const media of data.media) {
        if (media.media_url_https) {
          mediaUrls.push(media.media_url_https)
        }
      }
    }

    // Check for article URLs in the tweet
    let articleUrl = ''
    if (data.urls && Array.isArray(data.urls)) {
      for (const urlObj of data.urls) {
        if (urlObj.expanded_url && urlObj.expanded_url.includes('/article/')) {
          articleUrl = urlObj.expanded_url
          break
        }
      }
    }

    // Use tweet text as content, or create a title from display text
    let title = ''
    let content = tweetText
    let excerpt = ''
    let featuredImageUrl = ''

    // If there's a display_text, use it as title
    if (data.display_text && data.display_text !== tweetText) {
      title = data.display_text
    } else {
      title = tweetText.length > 100 ? tweetText.substring(0, 100) + '...' : tweetText
    }

    // Create excerpt
    excerpt = content.length > 200 ? content.substring(0, 200) + '...' : content
    
    // Use first media as featured image if available
    if (mediaUrls.length > 0) {
      featuredImageUrl = mediaUrls[0]
    }

    const category = categorizeContent(content || tweetText, username)
    const tags = extractTags(content || tweetText)
    const slug = generateSlug(title, tweetId)

    return {
      title: title || `Tweet by ${authorName}`,
      content: content || tweetText,
      excerpt: excerpt || (tweetText.length > 200 ? tweetText.substring(0, 200) + '...' : tweetText),
      slug,
      featured_image_url: featuredImageUrl || null,
      category,
      tags,
      author_name: authorName,
      author_handle: authorHandle,
      tweet_id: tweetId,
      tweet_url: `https://x.com/${username}/status/${tweetId}`,
      article_url: articleUrl || null,
      published_at: createdAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  } catch (error) {
    console.error(`Error processing tweet data for ${tweetId}:`, error)
    return null
  }
}

async function saveToSupabase(articleData: any) {
  try {
    // Check if article already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('tweet_id', articleData.tweet_id)
      .single()

    if (existing) {
      // Update existing article
      const { error } = await supabase
        .from('articles')
        .update({
          title: articleData.title,
          content: articleData.content,
          excerpt: articleData.excerpt,
          featured_image_url: articleData.featured_image_url,
          category: articleData.category,
          tags: articleData.tags,
          article_url: articleData.article_url,
          updated_at: articleData.updated_at
        })
        .eq('tweet_id', articleData.tweet_id)

      if (error) {
        console.error('Error updating article:', error)
        return false
      }
      console.log(`Updated article for tweet ${articleData.tweet_id}`)
    } else {
      // Insert new article
      const { error } = await supabase
        .from('articles')
        .insert([articleData])

      if (error) {
        console.error('Error inserting article:', error)
        return false
      }
      console.log(`Inserted new article for tweet ${articleData.tweet_id}`)
    }
    
    return true
  } catch (error) {
    console.error('Error saving to Supabase:', error)
    return false
  }
}

async function processTweets() {
  console.log(`Starting to process ${tweetUrls.length} tweets...`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < tweetUrls.length; i++) {
    const url = tweetUrls[i]
    const tweetId = extractTweetId(url)
    const username = extractUsername(url)
    
    console.log(`\nProcessing ${i + 1}/${tweetUrls.length}: ${url}`)
    console.log(`Tweet ID: ${tweetId}, Username: ${username}`)
    
    if (!tweetId || !username) {
      console.error('Failed to extract tweet ID or username')
      errorCount++
      continue
    }
    
    // Fetch tweet data
    const tweetData = await fetchTweetData(tweetId)
    if (!tweetData) {
      console.error('Failed to fetch tweet data')
      errorCount++
      continue
    }
    
    // Process tweet data
    const articleData = processTweetData(tweetData, tweetId, username)
    if (!articleData) {
      console.error('Failed to process tweet data')
      errorCount++
      continue
    }
    
    console.log(`Processed article: ${articleData.title}`)
    console.log(`Category: ${articleData.category}, Tags: ${articleData.tags.join(', ')}`)
    
    // Save to Supabase
    const saved = await saveToSupabase(articleData)
    if (saved) {
      successCount++
    } else {
      errorCount++
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log(`\n=== Processing Complete ===`)
  console.log(`Successfully processed: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Total: ${tweetUrls.length}`)
}

// Run the script
processTweets().catch(console.error)
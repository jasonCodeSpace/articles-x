import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const rapidApiKey = process.env.RAPIDAPI_KEY!

function extractTweetId(url: string): string {
  const match = url.match(/status\/(\d+)/)
  return match ? match[1] : ''
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

async function debugTweet() {
  // Test with the first tweet
  const testUrl = 'https://x.com/wallet/status/1950732288754659694'
  const tweetId = extractTweetId(testUrl)
  
  console.log(`Debugging tweet: ${testUrl}`)
  console.log(`Tweet ID: ${tweetId}`)
  
  const data = await fetchTweetData(tweetId)
  if (!data) {
    console.log('No data received')
    return
  }
  
  console.log('\n=== Full API Response Structure ===')
  console.log(JSON.stringify(data, null, 2))
  
  // Check different possible structures
  console.log('\n=== Checking data.data ===')
  console.log('data.data exists:', !!data.data)
  
  if (data.data) {
    console.log('data.data keys:', Object.keys(data.data))
    
    // Check for different possible structures
    if (data.data.threaded_conversation_with_injections_v2) {
      console.log('\n=== threaded_conversation_with_injections_v2 ===')
      console.log('instructions exists:', !!data.data.threaded_conversation_with_injections_v2.instructions)
      if (data.data.threaded_conversation_with_injections_v2.instructions) {
        console.log('instructions length:', data.data.threaded_conversation_with_injections_v2.instructions.length)
      }
    }
    
    if (data.data.tweetResult) {
      console.log('\n=== tweetResult structure ===')
      console.log(JSON.stringify(data.data.tweetResult, null, 2))
    }
    
    if (data.data.tweet) {
      console.log('\n=== tweet structure ===')
      console.log(JSON.stringify(data.data.tweet, null, 2))
    }
  }
  
  // Check for other top-level structures
  console.log('\n=== Top-level keys ===')
  console.log('Top-level keys:', Object.keys(data))
}

// Run the debug
debugTweet().catch(console.error)
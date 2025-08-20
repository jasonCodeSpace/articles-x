import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const rapidApiKey = process.env.RAPIDAPI_KEY!
const rapidApiHost = process.env.RAPIDAPI_HOST!

async function testSingleTweet() {
  const tweetId = '1932462252109480065'
  const url = 'https://twitter241.p.rapidapi.com/tweet'
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': rapidApiKey,
      'x-rapidapi-host': rapidApiHost
    }
  }

  try {
    const response = await fetch(`${url}?pid=${tweetId}`, options)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const apiResponse = await response.json()
    
    // Extract tweet data from the new API response structure
    const conversation = apiResponse.data?.threaded_conversation_with_injections_v2
    if (!conversation?.instructions) {
      throw new Error(`Invalid API response structure for tweet ${tweetId}`)
    }

    // Find the instruction with entries (usually TimelineAddEntries)
    let tweetData = null
    let userResult = null
    let legacy = null
    let userLegacy = null
    let articleData = null

    for (const instruction of conversation.instructions) {
      if (instruction.entries && instruction.entries.length > 0) {
        const entry = instruction.entries[0]
        if (entry.content?.itemContent?.tweet_results?.result) {
          tweetData = entry.content.itemContent.tweet_results.result
          userResult = tweetData.core?.user_results?.result
          legacy = tweetData.legacy
          userLegacy = userResult?.legacy
          articleData = tweetData.article
          break
        }
      }
    }

    console.log('=== Tweet Data Found ===') 
    console.log('Has tweetData:', !!tweetData)
    console.log('Has legacy:', !!legacy)
    console.log('Has userLegacy:', !!userLegacy)
    console.log('Has articleData:', !!articleData)
    
    if (legacy) {
      console.log('\n=== Legacy Data ===')
      console.log('Full text:', legacy.full_text)
    }
    
    if (articleData) {
      console.log('\n=== Article Data ===')
      console.log('Article keys:', Object.keys(articleData))
      console.log('Full article object:', JSON.stringify(articleData, null, 2))
    } else {
      console.log('\n=== No Article Data Found ===')
      console.log('Tweet data keys:', Object.keys(tweetData || {}))
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testSingleTweet()
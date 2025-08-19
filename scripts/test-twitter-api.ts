import dotenv from 'dotenv'
import { createTwitterClient } from '../lib/twitter'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testTwitterAPI() {
  console.log('=== Testing Twitter API ===\n')
  
  // Test environment variables
  console.log('Environment check:')
  console.log('RAPIDAPI_KEY:', process.env.RAPIDAPI_KEY ? 'Set' : 'Not set')
  console.log('RAPIDAPI_HOST:', process.env.RAPIDAPI_HOST)
  console.log()
  
  try {
    const twitterClient = createTwitterClient()
    
    // Test with the first list ID from our environment
    const testListId = '1937404509015216229'
    console.log(`Testing with list ID: ${testListId}`)
    
    console.log('Fetching tweets...')
    const result = await twitterClient.fetchListTimeline({ listId: testListId })
    
    console.log(`Found ${result.tweets.length} tweets`)
    console.log(`Next cursor: ${result.nextCursor ? 'Yes' : 'No'}`)
    
    if (result.tweets.length > 0) {
      console.log('\nFirst tweet:')
      const firstTweet = result.tweets[0]
      console.log('- ID:', firstTweet.legacy?.id_str || firstTweet.rest_id)
      console.log('- Text:', firstTweet.legacy?.full_text || firstTweet.legacy?.text || 'No text')
      console.log('- Author:', firstTweet.legacy?.user?.screen_name || firstTweet.core?.user_results?.result?.legacy?.screen_name || 'Unknown')
      console.log('- Created:', firstTweet.legacy?.created_at)
    } else {
      console.log('\n❌ No tweets found for this list')
    }
    
  } catch (error) {
    console.error('❌ Error testing Twitter API:', error)
    if (error instanceof Error && 'status' in error) {
      console.error('Status:', (error as any).status)
      console.error('Response:', (error as any).response)
    }
  }
}

testTwitterAPI()
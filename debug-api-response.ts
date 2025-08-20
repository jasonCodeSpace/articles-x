import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const rapidApiKey = process.env.RAPIDAPI_KEY!
const rapidApiHost = process.env.RAPIDAPI_HOST!

async function debugApiResponse() {
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
    const data = await response.json()
    
    console.log('=== API Response Structure ===')
    console.log('Keys at root level:', Object.keys(data))
    
    if (data.data) {
      console.log('\nKeys in data:', Object.keys(data.data))
      
      if (data.data.threaded_conversation_with_injections_v2) {
        console.log('\nKeys in threaded_conversation_with_injections_v2:', Object.keys(data.data.threaded_conversation_with_injections_v2))
        
        const conversation = data.data.threaded_conversation_with_injections_v2
        if (conversation.instructions && conversation.instructions.length > 0) {
          console.log('\nInstructions length:', conversation.instructions.length)
          
          // Check all instructions to find the one with entries
          for (let i = 0; i < conversation.instructions.length; i++) {
            const instruction = conversation.instructions[i]
            console.log(`\nInstruction ${i} keys:`, Object.keys(instruction))
            console.log(`Instruction ${i} type:`, instruction.type)
            
            if (instruction.entries && instruction.entries.length > 0) {
              console.log(`\nFound entries in instruction ${i}, length:`, instruction.entries.length)
              
              const firstEntry = instruction.entries[0]
              console.log('\nFirst entry keys:', Object.keys(firstEntry))
              
              if (firstEntry.content) {
                console.log('\nContent keys:', Object.keys(firstEntry.content))
                
                if (firstEntry.content.itemContent) {
                  console.log('\nItemContent keys:', Object.keys(firstEntry.content.itemContent))
                  
                  if (firstEntry.content.itemContent.tweet_results) {
                    console.log('\nTweet_results keys:', Object.keys(firstEntry.content.itemContent.tweet_results))
                    
                    if (firstEntry.content.itemContent.tweet_results.result) {
                      const tweetResult = firstEntry.content.itemContent.tweet_results.result
                      console.log('\nTweet result keys:', Object.keys(tweetResult))
                      
                      if (tweetResult.legacy) {
                         console.log('\nLegacy keys:', Object.keys(tweetResult.legacy))
                         console.log('\nFull text:', tweetResult.legacy.full_text)
                       }
                       
                       if (tweetResult.article) {
                         console.log('\nArticle keys:', Object.keys(tweetResult.article))
                         console.log('\nArticle content:', JSON.stringify(tweetResult.article, null, 2))
                       }
                      
                      if (tweetResult.core) {
                        console.log('\nCore keys:', Object.keys(tweetResult.core))
                        
                        if (tweetResult.core.user_results && tweetResult.core.user_results.result) {
                          const userResult = tweetResult.core.user_results.result
                          console.log('\nUser result keys:', Object.keys(userResult))
                          
                          if (userResult.legacy) {
                            console.log('\nUser legacy keys:', Object.keys(userResult.legacy))
                            console.log('\nUser name:', userResult.legacy.name)
                            console.log('Screen name:', userResult.legacy.screen_name)
                          }
                        }
                      }
                      
                      // Found the tweet data, break out of loop
                      break
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

debugApiResponse()
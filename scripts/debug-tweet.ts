import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST!;

async function debugTweet(tweetId: string) {
  console.log(`Testing tweet ID: ${tweetId}`);
  
  try {
    const response = await fetch(`https://${RAPIDAPI_HOST}/tweet?pid=${tweetId}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });

    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return;
    }

    const data = await response.json();
    console.log('Full response structure:');
    console.log(JSON.stringify(data, null, 2).substring(0, 1000) + '...');
    
    // Test the data path - check all instructions
    const instructions = data.data?.threaded_conversation_with_injections_v2?.instructions || [];
    console.log('\nInstructions found:', instructions.length);
    
    let tweetResult = null;
    let foundInstructionIndex = -1;
    
    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      console.log(`Instruction ${i}: type=${instruction.type}, has entries=${!!instruction.entries}`);
      
      if (instruction.entries && instruction.entries.length > 0) {
        console.log(`  Entries in instruction ${i}:`, instruction.entries.length);
        
        for (let j = 0; j < instruction.entries.length; j++) {
          const entry = instruction.entries[j];
          const result = entry.content?.itemContent?.tweet_results?.result;
          
          if (result && result.rest_id === tweetId) {
            tweetResult = result;
            foundInstructionIndex = i;
            console.log(`  Found tweet result in instruction ${i}, entry ${j}`);
            break;
          }
        }
        
        if (tweetResult) break;
      }
    }
    
    console.log('\nTweet result found:', !!tweetResult);
    
    if (tweetResult) {
      console.log('Found in instruction index:', foundInstructionIndex);
      console.log('Legacy data found:', !!tweetResult.legacy);
      console.log('User data found:', !!tweetResult.core?.user_results?.result?.legacy);
      
      if (tweetResult.legacy) {
        console.log('Tweet text:', tweetResult.legacy.full_text?.substring(0, 100));
      }
    } else {
      console.log('\nNo tweet result found in any instruction');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test with the tweet ID from our successful curl test
debugTweet('1948019311752151066');
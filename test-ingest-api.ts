import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testIngestApi() {
  try {
    console.log('Testing ingest API with known working list ID...')
    
    // Use the list ID that we know works from our previous tests
    const testListId = '78468360'
    
    const response = await fetch('http://localhost:3001/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || 'test-secret'
      },
      body: JSON.stringify({
        listIds: [testListId],
        dryRun: false
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    console.log('\n=== Ingest API Response ===')
    console.log('Success:', result.success)
    console.log('Message:', result.message)
    console.log('Processing time:', result.processingTimeMs + 'ms')
    console.log('\n=== Stats ===')
    console.log('Total tweets processed:', result.stats.totalTweetsProcessed)
    console.log('Articles inserted:', result.stats.inserted)
    console.log('Articles updated:', result.stats.updated)
    console.log('Articles skipped:', result.stats.skipped)
    
    console.log('\n=== List Details ===')
    result.stats.lists.forEach((list: any) => {
      console.log(`List ${list.listId}:`)
      console.log(`  - Tweets found: ${list.tweetsFound}`)
      console.log(`  - Articles harvested: ${list.articlesHarvested}`)
      if (list.errors.length > 0) {
        console.log(`  - Errors: ${list.errors.join(', ')}`)
      }
    })
    
  } catch (error) {
    console.error('Error testing ingest API:', error)
  }
}

testIngestApi()
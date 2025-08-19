import dotenv from 'dotenv'
import axios from 'axios'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function debugTwitterResponse() {
  const listId = '1937404509015216229'
  const url = `https://twitter241.p.rapidapi.com/list-timeline?listId=${listId}`
  
  console.log('=== Debugging Twitter API Response ===')
  console.log('URL:', url)
  console.log('Headers:')
  console.log('  x-rapidapi-host:', process.env.RAPIDAPI_HOST)
  console.log('  x-rapidapi-key:', process.env.RAPIDAPI_KEY ? 'Set' : 'Not set')
  console.log()
  
  try {
    const response = await axios.get(url, {
      headers: {
        'x-rapidapi-host': process.env.RAPIDAPI_HOST!,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
      },
      timeout: 30000,
    })
    
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log()
    console.log('Response Data Type:', typeof response.data)
    console.log('Response Data Keys:', Object.keys(response.data || {}))
    console.log()
    console.log('Full Response Data:')
    console.log(JSON.stringify(response.data, null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

debugTwitterResponse()
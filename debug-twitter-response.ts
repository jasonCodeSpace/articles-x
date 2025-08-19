import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function debugTwitterResponse() {
  try {
    const listId = '1937404509015216229'
    const url = `https://twitter241.p.rapidapi.com/list-timeline?listId=${listId}`
    
    console.log('Making request to:', url)
    
    const response = await axios.get(url, {
      headers: {
        'x-rapidapi-host': process.env.RAPIDAPI_HOST!,
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
      },
      timeout: 30000,
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)
    console.log('\n=== FULL RESPONSE DATA ===\n')
    console.log(JSON.stringify(response.data, null, 2))
    
    // Check the structure
    console.log('\n=== RESPONSE STRUCTURE ANALYSIS ===\n')
    console.log('Type of response.data:', typeof response.data)
    console.log('Keys in response.data:', Object.keys(response.data || {}))
    
    if (response.data?.data) {
      console.log('response.data.data exists')
      console.log('Keys in response.data.data:', Object.keys(response.data.data))
    } else {
      console.log('response.data.data does NOT exist')
    }
    
    if (response.data?.list) {
      console.log('response.data.list exists')
      console.log('Keys in response.data.list:', Object.keys(response.data.list))
    } else {
      console.log('response.data.list does NOT exist')
    }
    
  } catch (error) {
    console.error('Error:', error)
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status)
      console.error('Response data:', error.response?.data)
    }
  }
}

debugTwitterResponse()
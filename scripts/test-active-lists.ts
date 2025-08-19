import { config } from 'dotenv'
import { getActiveTwitterListIds } from '../lib/twitter-lists'

// Load environment variables
config({ path: '.env.local' })

async function testActiveListIds() {
  try {
    console.log('Testing getActiveTwitterListIds function...')
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
    console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set')
    
    const activeListIds = await getActiveTwitterListIds()
    console.log('Active list IDs found:', activeListIds.length)
    console.log('List IDs:', activeListIds)
  } catch (error) {
    console.error('Error testing active list IDs:', error)
  }
}

testActiveListIds()
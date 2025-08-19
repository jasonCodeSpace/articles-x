import dotenv from 'dotenv'
import { getActiveTwitterListIds } from '../lib/twitter-lists'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function debugScheduler() {
  console.log('=== Debugging Scheduler Environment ===')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set')
  
  try {
    console.log('\nTesting getActiveTwitterListIds...')
    const listIds = await getActiveTwitterListIds()
    console.log(`Found ${listIds.length} active lists:`, listIds)
    
    if (listIds.length === 26) {
      console.log('✅ SUCCESS: All 26 lists found!')
    } else {
      console.log('❌ ERROR: Expected 26 lists, found', listIds.length)
    }
  } catch (error) {
    console.error('❌ ERROR:', error)
  }
}

debugScheduler()
#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_SERVICE_ROLE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Default Twitter lists (26 lists)
const DEFAULT_TWITTER_LISTS = [
  { list_id: '1937404509015216229', name: 'Crypto News 1', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1935584949018493392', name: 'Crypto News 2', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1935589446247735425', name: 'Crypto News 3', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1935688464059511209', name: 'Crypto News 4', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1935700214515482995', name: 'Crypto News 5', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1937337350088220835', name: 'Crypto News 6', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1935710460759667054', name: 'Crypto News 7', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1935714208374477027', name: 'Crypto News 8', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1935859754511089744', name: 'Crypto News 9', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1935864265035923899', name: 'Crypto News 10', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1935868968587133212', name: 'Crypto News 11', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1935872719746130315', name: 'Crypto News 12', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1935881324788642255', name: 'Crypto News 13', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936458870697652476', name: 'Crypto News 14', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936463381222486027', name: 'Crypto News 15', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936467892289540107', name: 'Crypto News 16', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936472403356594187', name: 'Crypto News 17', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936476914423648267', name: 'Crypto News 18', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936481425490702347', name: 'Crypto News 19', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936485936557756427', name: 'Crypto News 20', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936490447624810507', name: 'Crypto News 21', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936494958691864587', name: 'Crypto News 22', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936499469758918667', name: 'Crypto News 23', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936503980825972747', name: 'Crypto News 24', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936508491893026827', name: 'Crypto News 25', description: 'Cryptocurrency and blockchain news' },
  { list_id: '1936512002960080907', name: 'Crypto News 26', description: 'Cryptocurrency and blockchain news' }
]

async function initializeDefaultTwitterLists(): Promise<void> {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  // Check if lists already exist
  const { data: existingLists } = await supabase
    .from('twitter_lists')
    .select('list_id')
    .limit(1)
  
  if (existingLists && existingLists.length > 0) {
    console.log('Twitter lists already initialized')
    return
  }
  
  // Insert default lists
  const { error } = await supabase
    .from('twitter_lists')
    .insert(DEFAULT_TWITTER_LISTS)
  
  if (error) {
    console.error('Error initializing Twitter lists:', error)
    throw new Error('Failed to initialize Twitter lists')
  }
  
  console.log('Successfully initialized 26 default Twitter lists')
}

async function main() {
  console.log('🔧 Initializing Twitter Lists...')
  console.log('=================================')
  
  try {
    await initializeDefaultTwitterLists()
    console.log('✅ Twitter lists initialized successfully!')
  } catch (error) {
    console.error('❌ Error initializing Twitter lists:', error)
    process.exit(1)
  }
}

main()
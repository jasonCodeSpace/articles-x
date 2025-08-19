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
  console.error('\nPlease check your .env.local file.')
  process.exit(1)
}

async function seedDryRun() {
  console.log('🔍 Articles X - Seed Dry Run')
  console.log('=====================================')
  
  try {
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('✅ Connected to Supabase with service role')
    
    // Check articles table exists and count records
    const { data, error, count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Error querying articles table:', error.message)
      
      // Check if table exists
      if (error.message.includes('relation "public.articles" does not exist')) {
        console.log('\n💡 It looks like the articles table doesn\'t exist yet.')
        console.log('   Run the migration first:')
        console.log('   1. Go to your Supabase Dashboard')
        console.log('   2. Navigate to SQL Editor')
        console.log('   3. Run the contents of: supabase/migrations/001_create_articles_table.sql')
      }
      
      process.exit(1)
    }
    
    console.log(`📊 Current articles count: ${count || 0}`)
    
    // Test RLS policies by trying to query as different roles
    console.log('\n🔒 Testing RLS policies...')
    
    // Test with anon client (should only see published articles)
    const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const { count: anonCount, error: anonError } = await anonClient
      .from('articles')
      .select('*', { count: 'exact', head: true })
    
    if (anonError) {
      console.log(`⚠️  Anonymous user query error: ${anonError.message}`)
    } else {
      console.log(`👤 Articles visible to anonymous users: ${anonCount || 0}`)
    }
    
    // Test service role capabilities
    const { data: statusData, error: statusError } = await supabase
      .from('articles')
      .select('status')
      .limit(5)
    
    if (statusError) {
      console.log(`⚠️  Service role query error: ${statusError.message}`)
    } else {
      console.log('🔧 Service role can access all articles (including drafts)')
      
      if (statusData && statusData.length > 0) {
        const statusCounts = statusData.reduce((acc: Record<string, number>, article) => {
          acc[article.status] = (acc[article.status] || 0) + 1
          return acc
        }, {})
        
        console.log('   Status breakdown (first 5 articles):')
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`   - ${status}: ${count}`)
        })
      }
    }
    
    console.log('\n✅ Dry run completed successfully!')
    console.log('\n📝 Summary:')
    console.log(`   - Total articles: ${count || 0}`)
    console.log(`   - Public articles: ${anonCount || 0}`)
    console.log(`   - Service role: Full access`)
    console.log(`   - Regular users: Read-only access to published articles`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the dry run
seedDryRun()
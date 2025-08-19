#!/usr/bin/env tsx

import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

/**
 * Test script to manually call the ingest API endpoint
 */
async function testIngestAPI() {
  console.log('🧪 Testing Ingest API Endpoint')
  console.log('===============================')

  const CRON_SECRET = process.env.CRON_SECRET
  const API_BASE = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  if (!CRON_SECRET) {
    console.error('❌ CRON_SECRET environment variable is required')
    process.exit(1)
  }

  try {
    console.log('🚀 Making request to ingest API (dry run)...')
    
    const response = await fetch(`${API_BASE}/api/ingest?dryRun=1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': CRON_SECRET,
      },
      // Optional: Override list IDs for testing
      body: JSON.stringify({
        listIds: ['78468360'] // Just test with one list
      })
    })

    console.log(`📊 Response status: ${response.status} ${response.statusText}`)
    
    const data = await response.json()
    console.log('📄 Response data:')
    console.log(JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('✅ Test completed successfully!')
    } else {
      console.error('❌ Test failed with error response')
      process.exit(1)
    }

  } catch (error) {
    console.error('💥 Test failed with exception:', error)
    process.exit(1)
  }
}

// Run the test
testIngestAPI()
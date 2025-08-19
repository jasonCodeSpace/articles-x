#!/usr/bin/env tsx

/**
 * Test script for the trigger-all-lists API endpoint
 * Usage: tsx scripts/test-trigger-all-lists.ts [--dry-run] [--local]
 */

import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

interface TestResult {
  success: boolean
  message: string
  error?: string
  data?: unknown
}

async function testTriggerAllLists(baseUrl: string, dryRun: boolean = false): Promise<TestResult> {
  try {
    const url = new URL('/api/trigger-all-lists', baseUrl)
    if (dryRun) {
      url.searchParams.set('dryRun', '1')
    }

    console.log(`🧪 Testing trigger-all-lists endpoint...`)
    console.log(`📍 URL: ${url.toString()}`)
    console.log(`🔄 Dry run: ${dryRun}`)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: `API request failed with status ${response.status}`,
        error: data.error || data.message || 'Unknown error',
        data
      }
    }

    return {
      success: true,
      message: 'API request successful',
      data
    }

  } catch (error) {
    return {
      success: false,
      message: 'Request failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const useLocal = args.includes('--local')

  // Determine base URL
  let baseUrl: string
  if (useLocal) {
    baseUrl = 'http://localhost:3000'
  } else {
    // Try to get from environment or use a default
    baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL 
      ? process.env.NEXT_PUBLIC_APP_URL
      : 'https://your-app.vercel.app' // Replace with your actual domain
  }

  console.log('🚀 Testing trigger-all-lists endpoint...')
  console.log(`🌐 Base URL: ${baseUrl}`)
  console.log(`⚙️  Dry run: ${dryRun}`)
  console.log('─'.repeat(50))

  const result = await testTriggerAllLists(baseUrl, dryRun)

  if (result.success) {
    console.log('✅ Test passed!')
    console.log(`📝 Message: ${result.message}`)
    if (result.data) {
      console.log('📊 Response data:', JSON.stringify(result.data, null, 2))
    }
  } else {
    console.log('❌ Test failed!')
    console.log(`📝 Message: ${result.message}`)
    if (result.error) {
      console.log(`🚨 Error: ${result.error}`)
    }
    if (result.data) {
      console.log('📊 Response data:', JSON.stringify(result.data, null, 2))
    }
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
}
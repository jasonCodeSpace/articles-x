#!/usr/bin/env tsx

/**
 * Script to regenerate static pages after article summaries are generated
 * This should be called after the Generate Article Summaries job completes
 */

import { NextRequest } from 'next/server'

const VERCEL_DEPLOY_HOOK_URL = process.env.VERCEL_DEPLOY_HOOK_URL
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://articles-x.vercel.app'

async function revalidatePages() {
  const pagesToRevalidate = [
    '/new',
    '/new?filter=week',
    '/history'
  ]

  console.log('Starting page revalidation...')

  for (const page of pagesToRevalidate) {
    try {
      const url = `${BASE_URL}/api/revalidate?secret=${REVALIDATE_SECRET}&path=${encodeURIComponent(page)}`
      const response = await fetch(url, { method: 'POST' })
      
      if (response.ok) {
        console.log(`✅ Successfully revalidated: ${page}`)
      } else {
        console.error(`❌ Failed to revalidate ${page}:`, response.status, response.statusText)
      }
    } catch (error) {
      console.error(`❌ Error revalidating ${page}:`, error)
    }
  }

  console.log('Page revalidation completed')
}

async function triggerDeployment() {
  if (!VERCEL_DEPLOY_HOOK_URL) {
    console.log('No deploy hook URL configured, skipping deployment trigger')
    return
  }

  try {
    console.log('Triggering Vercel deployment...')
    const response = await fetch(VERCEL_DEPLOY_HOOK_URL, { method: 'POST' })
    
    if (response.ok) {
      console.log('✅ Successfully triggered deployment')
    } else {
      console.error('❌ Failed to trigger deployment:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('❌ Error triggering deployment:', error)
  }
}

async function main() {
  console.log('🚀 Starting static page regeneration process...')
  
  // Option 1: Revalidate specific pages (faster)
  await revalidatePages()
  
  // Option 2: Trigger full deployment (slower but more thorough)
  // await triggerDeployment()
  
  console.log('✨ Static page regeneration process completed')
}

if (require.main === module) {
  main().catch(console.error)
}

export { revalidatePages, triggerDeployment }
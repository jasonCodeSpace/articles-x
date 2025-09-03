#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { generateSlugFromTitle, generateShortId } from '@/lib/url-utils'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. Set them in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type ArticleRow = {
  id: string
  title: string
  slug: string | null
  article_published_at: string
}

async function regenerateRecentSlugs() {
  console.log('🔧 Regenerating slugs for recent articles...')
  console.log('='.repeat(60))

  try {
    // Get articles from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, slug, article_published_at')
      .gte('article_published_at', sevenDaysAgo.toISOString())
      .not('title', 'is', null)
      .order('article_published_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching articles:', fetchError)
      return
    }

    if (!articles || articles.length === 0) {
      console.log('ℹ️  No recent articles found to update')
      return
    }

    console.log(`📊 Found ${articles.length} recent articles to process`)
    console.log('')

    let updatedCount = 0
    let skippedCount = 0

    for (const article of articles) {
      const titleSlug = generateSlugFromTitle(article.title)
      const shortId = generateShortId(article.id)
      const newSlug = `${titleSlug}--${shortId}`

      // Check if slug needs updating
      if (article.slug === newSlug) {
        console.log(`⏭️  Skipping article "${article.title.substring(0, 50)}..." - slug already correct`)
        skippedCount++
        continue
      }

      // Update the slug
      const { error: updateError } = await supabase
        .from('articles')
        .update({ slug: newSlug })
        .eq('id', article.id)

      if (updateError) {
        console.error(`❌ Error updating article ${article.id}:`, updateError)
        continue
      }

      console.log(`✅ Updated slug for "${article.title.substring(0, 50)}...":`)
      console.log(`   Old: ${article.slug || 'null'}`)
      console.log(`   New: ${newSlug}`)
      console.log('')
      
      updatedCount++
    }

    console.log('='.repeat(60))
    console.log(`🎉 Slug regeneration completed!`)
    console.log(`   📈 Updated: ${updatedCount} articles`)
    console.log(`   ⏭️  Skipped: ${skippedCount} articles (already correct)`)
    console.log(`   📊 Total processed: ${articles.length} articles`)

  } catch (error) {
    console.error('❌ Error in regenerateRecentSlugs:', error)
    process.exit(1)
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Recent Slug Regeneration Script...')
  console.log('')
  
  try {
    await regenerateRecentSlugs()
    console.log('')
    console.log('✨ Script completed successfully!')
  } catch (error) {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

export { regenerateRecentSlugs }
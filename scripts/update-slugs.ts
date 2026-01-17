/**
 * Script to update all article slugs to be based on title_english
 * Removes the --shortId suffix
 * Run with: npx tsx scripts/update-slugs.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Generate URL-safe slug from title
 */
function generateSlugFromTitle(title: string): string {
  if (!title || title.trim().length === 0) {
    return ''
  }

  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
}

/**
 * Get unique slug by adding suffix if needed
 */
async function getUniqueSlug(baseSlug: string, currentId: string): Promise<string> {
  let slug = baseSlug
  let suffix = 1

  while (true) {
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .limit(1)

    if (!existing || existing.length === 0) {
      return slug
    }

    if (existing[0].id === currentId) {
      return slug
    }

    slug = `${baseSlug}-${suffix}`
    suffix++
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Fetching all articles with title_english...')

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, title_english, slug')
    .not('title_english', 'is', null)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching articles:', error)
    process.exit(1)
  }

  if (!articles || articles.length === 0) {
    console.log('No articles found!')
    process.exit(0)
  }

  console.log(`Found ${articles.length} articles`)
  console.log('Updating slugs...')

  let updated = 0
  let failed = 0
  let unchanged = 0

  for (const article of articles) {
    const titleToUse = article.title_english || article.title
    const newSlug = generateSlugFromTitle(titleToUse)

    if (!newSlug) {
      console.log(`[${article.id.substring(0, 8)}] Skipping - empty slug generated`)
      unchanged++
      continue
    }

    // Get unique slug (adds suffix if duplicate exists)
    const uniqueSlug = await getUniqueSlug(newSlug, article.id)

    // Check if slug actually changed
    if (article.slug === uniqueSlug) {
      console.log(`[${article.id.substring(0, 8)}] Unchanged: ${uniqueSlug}`)
      unchanged++
      continue
    }

    const { error } = await supabase
      .from('articles')
      .update({ slug: uniqueSlug })
      .eq('id', article.id)

    if (error) {
      console.error(`[${article.id.substring(0, 8)}] Failed: ${error.message}`)
      failed++
    } else {
      console.log(`[${article.id.substring(0, 8)}] ${article.slug} -> ${uniqueSlug}`)
      updated++
    }
  }

  console.log(`\nDone! Updated: ${updated}, Unchanged: ${unchanged}, Failed: ${failed}`)
}

main().catch(console.error)

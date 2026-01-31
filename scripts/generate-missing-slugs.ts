import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const envConfig = readFileSync('.env.local', 'utf-8')
envConfig.split('\n').forEach(line => {
  const [key, ...values] = line.split('=')
  if (key && values.length > 0) {
    process.env[key] = values.join('=')
  }
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Generate slug from title
function generateSlug(title: string): string {
  if (!title) return 'untitled'

  return title
    .toLowerCase()
    // Replace Japanese and special characters with hyphen
    .replace(/[\s\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef]+/g, '-')
    // Remove special characters except hyphen
    .replace(/[^\p{L}\p{N}-]/gu, '')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit to 100 characters
    .substring(0, 100)
}

// Generate unique slug (append short ID if needed)
async function getUniqueSlug(baseSlug: string, articleId: string): Promise<string> {
  let slug = baseSlug
  let counter = 0

  while (true) {
    const { data } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .neq('id', articleId)
      .limit(1)
      .maybeSingle()

    if (!data) {
      return slug
    }

    counter++
    slug = `${baseSlug}-${counter}`

    // Safety limit
    if (counter > 100) {
      return `${baseSlug}-${articleId.substring(0, 8)}`
    }
  }
}

async function generateMissingSlugs() {
  console.log('Finding articles without slugs...\n')

  let offset = 0
  const batchSize = 100
  let totalUpdated = 0

  while (true) {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, title_english, slug')
      .is('slug', null)
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.error('Error:', error)
      break
    }

    if (!articles || articles.length === 0) {
      break
    }

    console.log(`Found ${articles.length} articles without slugs`)

    for (const article of articles) {
      const title = article.title_english || article.title || 'untitled'
      const baseSlug = generateSlug(title)
      const uniqueSlug = await getUniqueSlug(baseSlug, article.id)

      const { error: updateError } = await supabase
        .from('articles')
        .update({ slug: uniqueSlug })
        .eq('id', article.id)

      if (updateError) {
        console.error(`Failed to update ${article.id}: ${updateError.message}`)
      } else {
        const titleShort = title.substring(0, 40)
        console.log(`Updated: "${titleShort}..." -> slug: ${uniqueSlug}`)
        totalUpdated++
      }
    }

    offset += batchSize
    console.log(`\nProgress: ${totalUpdated} articles updated so far\n`)

    // Safety limit
    if (offset > 5000) {
      console.log('Reached safety limit')
      break
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total articles updated: ${totalUpdated}`)
  process.exit(0)
}

generateMissingSlugs().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pskhqphqikghdyqmgsud.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// Expand t.co short URL
async function expandTcoUrl(tcoUrl: string): Promise<string> {
  try {
    // Method 1: HEAD request
    const response = await fetch(tcoUrl, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    })

    const location = response.headers.get('location')
    if (location && location !== tcoUrl) {
      return location
    }
  } catch (e) {
    // Ignore
  }

  try {
    // Method 2: GET request
    const response = await fetch(tcoUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    })

    const location = response.headers.get('location')
    if (location && location !== tcoUrl) {
      return location
    }
  } catch (e) {
    // Ignore
  }

  return tcoUrl // Return original if can't expand
}

async function expandArticleUrls() {
  console.log('Expanding t.co URLs in articles...\n')

  // Get articles with t.co URLs
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, article_url, title')
    .like('article_url', 'https://t.co/%')
    .limit(50)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${articles?.length || 0} articles with t.co URLs\n`)

  let expandedCount = 0
  let failedCount = 0

  for (const article of articles || []) {
    console.log(`Processing: ${article.title?.substring(0, 50)}...`)

    const expandedUrl = await expandTcoUrl(article.article_url!)

    if (expandedUrl !== article.article_url) {
      console.log(`  Expanded to: ${expandedUrl}`)

      const { error: updateError } = await supabase
        .from('articles')
        .update({ article_url: expandedUrl })
        .eq('id', article.id)

      if (updateError) {
        console.error(`  Failed to update: ${updateError.message}`)
        failedCount++
      } else {
        console.log(`  Updated successfully`)
        expandedCount++
      }
    } else {
      console.log(`  Could not expand (URL unchanged)`)
      failedCount++
    }

    // Rate limiting - wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log(`\n=== Summary ===`)
  console.log(`Processed: ${articles?.length || 0}`)
  console.log(`Expanded: ${expandedCount}`)
  console.log(`Failed: ${failedCount}`)
}

expandArticleUrls().then(() => {
  console.log('\nDone!')
  process.exit(0)
}).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})

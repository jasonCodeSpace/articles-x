import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pskhqphqikghdyqmgsud.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

// Expand t.co short URL by following redirects
async function expandShortUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    })

    const location = response.headers.get('location')
    if (location && location !== url) {
      return location
    }

    // If HEAD doesn't work, try GET
    const getResponse = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    })

    const getLocation = getResponse.headers.get('location')
    if (getLocation && getLocation !== url) {
      return getLocation
    }

    return url
  } catch (error) {
    console.error(`Error expanding ${url}:`, error)
    return url
  }
}

async function expandTcoUrls() {
  console.log('Fetching articles with t.co URLs...')

  // Fetch articles where article_url contains t.co
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, article_url')
    .like('article_url', '%t.co/%')
    .limit(100)

  if (error) {
    console.error('Error fetching articles:', error)
    return
  }

  const articleCount = articles?.length || 0
  console.log(`Found ${articleCount} articles with t.co URLs`)

  let expandedCount = 0
  let failedCount = 0

  for (const article of articles || []) {
    console.log(`\n--- Article ID: ${article.id} ---`)
    console.log(`Short URL: ${article.article_url}`)

    const expandedUrl = await expandShortUrl(article.article_url!)
    console.log(`Expanded URL: ${expandedUrl}`)

    if (expandedUrl !== article.article_url) {
      // Update the article_url
      const { error: updateError } = await supabase
        .from('articles')
        .update({ article_url: expandedUrl })
        .eq('id', article.id)

      if (updateError) {
        console.error(`Failed to update: ${updateError.message}`)
        failedCount++
      } else {
        console.log(`Updated successfully`)
        expandedCount++
      }
    } else {
      console.log(`No expansion possible (URL unchanged)`)
      failedCount++
    }

    // Rate limiting - wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total articles processed: ${articleCount}`)
  console.log(`Successfully expanded: ${expandedCount}`)
  console.log(`Failed/unchanged: ${failedCount}`)
}

expandTcoUrls().then(() => {
  console.log('\nDone!')
  process.exit(0)
}).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})

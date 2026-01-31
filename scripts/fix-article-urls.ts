import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'

// Get service role key from env
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to extract article URL from text
function extractArticleUrl(text: string | null | undefined): string | null {
  if (!text) return null

  // Look for URLs in the text that are NOT x.com or twitter.com URLs
  const urlRegex = /https?:\/\/(?!x\.com|twitter\.com)[^\s]+/gi
  const matches = text.match(urlRegex)

  if (matches && matches.length > 0) {
    // Return the first non-X URL found
    return matches[0].trim()
  }

  return null
}

async function fixArticleUrls() {
  console.log('Fetching articles with X URLs in article_url field...')

  // Fetch articles where article_url contains x.com/status
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, article_url, tweet_text, full_article_content')
    .like('article_url', '%x.com/%/status/%')

  if (error) {
    console.error('Error fetching articles:', error)
    return
  }

  const articleCount = articles?.length || 0
  console.log(`Found ${articleCount} articles with X URLs`)

  let updatedCount = 0
  let notFoundCount = 0

  for (const article of articles || []) {
    console.log(`\n--- Article ID: ${article.id} ---`)
    console.log(`Current URL: ${article.article_url}`)

    // Try to extract real article URL from tweet_text or full_article_content
    const realUrl = extractArticleUrl(article.tweet_text) ||
                   extractArticleUrl(article.full_article_content)

    if (realUrl) {
      console.log(`Found real URL: ${realUrl}`)

      // Update the article_url
      const { error: updateError } = await supabase
        .from('articles')
        .update({ article_url: realUrl })
        .eq('id', article.id)

      if (updateError) {
        console.error(`Failed to update: ${updateError.message}`)
      } else {
        console.log(`Updated successfully`)
        updatedCount++
      }
    } else {
      console.log(`No real URL found in tweet_text or content`)
      if (article.tweet_text) {
        console.log(`Tweet text preview: ${article.tweet_text.substring(0, 150)}...`)
      }
      notFoundCount++
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total articles processed: ${articleCount}`)
  console.log(`Successfully updated: ${updatedCount}`)
  console.log(`No URL found: ${notFoundCount}`)
}

fixArticleUrls().then(() => {
  console.log('\nDone!')
  process.exit(0)
}).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})

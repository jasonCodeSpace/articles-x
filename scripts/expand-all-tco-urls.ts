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

async function expandTcoUrl(tcoUrl: string): Promise<string> {
  try {
    const response = await fetch(tcoUrl, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    })

    const location = response.headers.get('location')
    if (location && location !== tcoUrl && location.startsWith('http')) {
      return location
    }
  } catch (e) {
    // Ignore
  }

  try {
    const response = await fetch(tcoUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    })

    const location = response.headers.get('location')
    if (location && location !== tcoUrl && location.startsWith('http')) {
      return location
    }
  } catch (e) {
    // Ignore
  }

  return tcoUrl
}

async function expandAllTcoUrls() {
  console.log('Fetching all articles with t.co URLs...\n')

  let allExpanded = 0
  let batch = 0
  const batchSize = 100

  while (true) {
    const offset = batch * batchSize

    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, article_url, title')
      .like('article_url', 'https://t.co/%')
      .range(offset, offset + batchSize - 1)
      .order('id', { ascending: true })

    if (error) {
      console.error('Error:', error)
      break
    }

    if (!articles || articles.length === 0) {
      console.log('No more articles to process.')
      break
    }

    console.log(`Batch ${batch + 1}: Found ${articles.length} articles with t.co URLs`)

    for (const article of articles) {
      const title = article.title?.substring(0, 40) || 'Unknown'
      console.log(`Processing: ${title}...`)

      const expandedUrl = await expandTcoUrl(article.article_url!)

      if (expandedUrl !== article.article_url) {
        console.log(`  Expanded: ${expandedUrl}`)

        const { error: updateError } = await supabase
          .from('articles')
          .update({ article_url: expandedUrl })
          .eq('id', article.id)

        if (updateError) {
          console.error(`  Failed to update: ${updateError.message}`)
        } else {
          console.log(`  Updated successfully`)
          allExpanded++
        }
      } else {
        console.log(`  Could not expand`)
      }

      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    batch++
    console.log(`\n--- Batch ${batch} complete ---\n`)

    // Safety limit to prevent infinite loops
    if (batch > 20) {
      console.log('Reached safety limit of 20 batches.')
      break
    }
  }

  console.log(`\n=== Final Summary ===`)
  console.log(`Total expanded: ${allExpanded}`)
  process.exit(0)
}

expandAllTcoUrls().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})

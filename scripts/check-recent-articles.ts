import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pskhqphqikghdyqmgsud.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRecentArticles() {
  console.log('Fetching recent articles...\n')

  // Try with updated_at which is a standard field
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${articles?.length || 0} recent articles\n`)

  for (const article of articles || []) {
    const articleTyped = article as any
    console.log('--- Article ---')
    console.log(`Updated: ${articleTyped.updated_at}`)
    console.log(`Tweet ID: ${articleTyped.tweet_id}`)
    console.log(`Title: ${articleTyped.title}`)
    console.log(`Slug: ${articleTyped.slug}`)
    console.log(`Source Type: ${articleTyped.source_type}`)
    console.log(`Indexed: ${articleTyped.indexed}`)
    console.log(`Article URL: ${articleTyped.article_url}`)
    console.log(`Summary English: ${articleTyped.summary_english ? 'Yes' : 'No'}`)
    console.log('')
  }
}

checkRecentArticles().then(() => {
  process.exit(0)
}).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})

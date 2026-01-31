import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pskhqphqikghdyqmgsud.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkManualArticles() {
  console.log('Fetching manually inserted articles...\n')

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, title_english, slug, article_url, source_type, manually_inserted_at, indexed, tweet_id, article_published_at')
    .eq('source_type', 'manual')
    .order('manually_inserted_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${articles?.length || 0} manual articles\n`)

  for (const article of articles || []) {
    console.log('--- Article ---')
    console.log(`ID: ${article.id}`)
    console.log(`Tweet ID: ${article.tweet_id}`)
    console.log(`Title: ${article.title}`)
    console.log(`Slug: ${article.slug}`)
    console.log(`Indexed: ${article.indexed}`)
    console.log(`Published At: ${article.article_published_at}`)
    console.log(`Article URL: ${article.article_url}`)
    console.log(`Inserted At: ${article.manually_inserted_at}`)
    console.log('')
  }
}

checkManualArticles().then(() => {
  process.exit(0)
}).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const envConfig = readFileSync('.env.local', 'utf-8')
envConfig.split('\n').forEach(line => {
  const [key, ...values] = line.split('=')
  if (key && values.length > 0) {
    process.env[key] = values.join('=')
  }
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function checkSlugStatus() {
  // Count articles with null slug
  const { count: nullCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .is('slug', null)

  console.log('Articles with null slug:', nullCount)

  // Count articles with empty string slug
  const { count: emptyCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('slug', '')

  console.log('Articles with empty string slug:', emptyCount)

  // Check specific articles
  const { data: specificArticles } = await supabase
    .from('articles')
    .select('tweet_id, title, slug')
    .in('tweet_id', ['2015052151475876322', '2015784327213183053', '2015039710180290599'])

  console.log('\nSpecific articles:')
  for (const a of specificArticles || []) {
    console.log(`  ${a.tweet_id}: slug = ${JSON.stringify(a.slug)}`)
  }

  process.exit(0)
}

checkSlugStatus().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})

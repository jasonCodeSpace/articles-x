import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local manually
const envConfig = readFileSync('.env.local', 'utf-8')
envConfig.split('\n').forEach(line => {
  const [key, ...values] = line.split('=')
  if (key && values.length > 0) {
    process.env[key] = values.join('=')
  }
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pskhqphqikghdyqmgsud.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExpandedUrls() {
  const { data } = await supabase
    .from('articles')
    .select('title, article_url')
    .like('article_url', 'https://x.com/i/article/%')
    .limit(10)

  console.log('Articles with expanded x.com/i/article/ URLs:')
  console.log('===============================================')
  for (const article of data || []) {
    console.log(`${article.title?.substring(0, 40)}...`)
    console.log(`  URL: ${article.article_url}`)
    console.log('')
  }

  process.exit(0)
}

checkExpandedUrls().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})

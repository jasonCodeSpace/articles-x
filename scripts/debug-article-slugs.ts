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

const tweetIds = [
  '2015052151475876322', // 考えてからでは遅すぎる
  '2015784327213183053', // その春に行けないけど
  '2015039710180290599', // 不眠に悩んだワイが...
  '2015118722558820705', // White People Didn't Invent Slavery
]

async function debugArticles() {
  for (const tweetId of tweetIds) {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('tweet_id', tweetId)
      .single()

    if (data) {
      const article = data as any
      console.log('========================================')
      console.log('Tweet ID:', tweetId)
      console.log('Title:', article.title?.substring(0, 50))
      console.log('Slug:', article.slug || 'MISSING!')
      console.log('Indexed:', article.indexed)
      console.log('Source Type:', article.source_type)
      console.log('Article URL:', article.article_url)
      console.log('Content Length:', article.content?.length || 0)
      console.log('========================================')
      console.log('')
    } else {
      console.log('Tweet ID:', tweetId, '- NOT FOUND')
      console.log('')
    }
  }
  process.exit(0)
}

debugArticles().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})

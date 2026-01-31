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
  '2015052151475876322',
  '2012220254504530043',
  '2015784327213183053',
  '2015039710180290599',
  '2015118722558820705',
  '2012608685462220879',
  '2013552215097778231',
  '2015709513903677634',
  '2014197314571952167',
  '2012956603297964167',
]

async function checkArticles() {
  for (const tweetId of tweetIds) {
    const { data } = await supabase
      .from('articles')
      .select('tweet_id, title, article_url, slug')
      .eq('tweet_id', tweetId)
      .single()

    if (data) {
      const article = data as any
      console.log('Tweet ID:', tweetId)
      console.log('Title:', article.title?.substring(0, 60))
      console.log('Article URL:', article.article_url)
      console.log('Slug:', article.slug)
      console.log('')
    } else {
      console.log('Tweet ID:', tweetId, '- NOT FOUND')
      console.log('')
    }
  }
  process.exit(0)
}

checkArticles().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pskhqphqikghdyqmgsud.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// The tweet IDs you mentioned
const targetTweetIds = [
  '2015052151475876322', // Jumpei_Mitsui
  '2012220254504530043', // IterIntellectus
  '2015784327213183053', // suisuiayaka
  '2015039710180290599', // yoppymodel
  '2015118722558820705', // thatsKAIZEN
  '2012608685462220879', // KobeissiLetter
  '2013552215097778231', // Tim_Denning
]

async function checkSpecificArticles() {
  console.log('Checking specific articles...\n')

  for (const tweetId of targetTweetIds) {
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('tweet_id', tweetId)
      .single()

    console.log(`--- Tweet ID: ${tweetId} ---`)
    if (error) {
      console.log(`Not found in database`)
    } else {
      const a = article as any
      console.log(`Title: ${a.title}`)
      console.log(`Slug: ${a.slug}`)
      console.log(`Article URL: ${a.article_url}`)
      console.log(`Indexed: ${a.indexed}`)
      console.log(`Summary: ${a.summary_english ? 'Yes' : 'No'}`)
      console.log(`Images: ${a.article_images?.length || 0}`)
      console.log(`Videos: ${a.article_videos?.length || 0}`)
    }
    console.log('')
  }
}

checkSpecificArticles().then(() => {
  process.exit(0)
}).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})

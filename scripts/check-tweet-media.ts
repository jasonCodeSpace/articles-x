import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pskhqphqikghdyqmgsud.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTweet() {
  const { data, error } = await supabase
    .from('tweets')
    .select('raw_data')
    .eq('article_id', 'ca4e62bd-8197-4373-ae1c-50159c9e20c8')
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Raw data available:', !!data.raw_data)
  if (!data.raw_data) {
    console.log('No raw data found')
    return
  }

  const tweetData = JSON.parse(data.raw_data)
  console.log('Article result available:', !!tweetData.article_results)

  if (tweetData.article_results?.result) {
    console.log('Article has media:', !!tweetData.article_results.result.cover_media)
    console.log('Cover media:', JSON.stringify(tweetData.article_results.result.cover_media, null, 2))

    // Check for content_state blocks with media
    if (tweetData.article_results.result.content_state?.blocks) {
      console.log('Content blocks:', tweetData.article_results.result.content_state.blocks.length)

      let allImages: string[] = []
      let allVideos: string[] = []

      tweetData.article_results.result.content_state.blocks.forEach((block: any, i: number) => {
        if (block.media?.length > 0) {
          console.log(`Block ${i} has ${block.media.length} media items:`)
          block.media.forEach((m: any) => {
            const url = m.media_url_https || m.media_url
            console.log('  ', url)
            if (url) {
              if (m.type?.includes('video') || url.includes('video')) {
                allVideos.push(url)
              } else {
                allImages.push(url)
              }
            }
          })
        }
      })

      console.log('Total images found:', allImages.length)
      allImages.forEach((img, i) => console.log(`  Image ${i + 1}:`, img))

      console.log('Total videos found:', allVideos.length)
      allVideos.forEach((vid, i) => console.log(`  Video ${i + 1}:`, vid))
    }
  }
}

checkTweet().then(() => {
  console.log('\nDone!')
  process.exit(0)
}).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})

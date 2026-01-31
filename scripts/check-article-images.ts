import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pskhqphqikghdyqmgsud.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkArticleContent() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, full_article_content, slug')
    .eq('slug', 'openclaw-clawdbot-kimi-25-a-step-by-step-tutorial-with-feishu-integration-guide-and-700-skill-resour')
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Title:', data.title)
  console.log('Content length:', data.full_article_content?.length || 0)
  console.log('Content preview:', data.full_article_content?.substring(0, 500) || 'No content')

  // Check for img tags in content
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
  const images: string[] = []
  let match
  while ((match = imgRegex.exec(data.full_article_content || '')) !== null) {
    images.push(match[1])
  }

  console.log('Found images in content:', images.length)
  images.forEach((img, i) => console.log(`  Image ${i + 1}:`, img))
}

checkArticleContent().then(() => {
  console.log('\nDone!')
  process.exit(0)
}).catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to generate better titles and content based on tweet context
function generateArticleContent(tweetData: any) {
  const tweetText = tweetData.text || ''
  const authorName = tweetData.author?.name || tweetData.author_name || ''
  const authorHandle = tweetData.author?.screen_name || tweetData.author_handle || ''
  const articleUrl = tweetData.article_url || ''
  
  // Extract meaningful title from tweet text or generate one
  let title = ''
  if (tweetText && tweetText !== articleUrl && !tweetText.startsWith('https://t.co/')) {
    // If tweet has meaningful text, use it as title
    title = tweetText.length > 100 ? tweetText.substring(0, 100) + '...' : tweetText
  } else {
    // Generate title based on author and context
    if (authorName.toLowerCase().includes('ai') || authorHandle.toLowerCase().includes('ai')) {
      title = `AI Article by ${authorName}`
    } else if (authorName.toLowerCase().includes('crypto') || authorHandle.toLowerCase().includes('wallet')) {
      title = `Crypto Article by ${authorName}`
    } else {
      title = `Article by ${authorName}`
    }
  }
  
  // Generate content description
  let content = ''
  if (tweetText && tweetText !== articleUrl && !tweetText.startsWith('https://t.co/')) {
    content = `${tweetText}\n\nOriginal article: ${articleUrl}`
  } else {
    content = `Article shared by ${authorName} (@${authorHandle.replace('@', '')})\n\nRead the full article: ${articleUrl}`
  }
  
  // Generate excerpt
  const excerpt = content.length > 200 ? content.substring(0, 200) + '...' : content
  
  return {
    title: title.trim(),
    content: content.trim(),
    excerpt: excerpt.trim()
  }
}

// Function to categorize content based on author and context
function categorizeContent(authorName: string, authorHandle: string, tweetText: string): string {
  const text = `${authorName} ${authorHandle} ${tweetText}`.toLowerCase()
  
  if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('machine learning') || text.includes('ml')) {
    return 'ai'
  } else if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum') || text.includes('blockchain') || text.includes('wallet') || text.includes('defi')) {
    return 'crypto'
  } else if (text.includes('tech') || text.includes('technology') || text.includes('software') || text.includes('programming')) {
    return 'tech'
  } else {
    return 'general'
  }
}

// Function to extract tags from content
function extractTags(authorName: string, authorHandle: string, tweetText: string): string[] {
  const tags: string[] = []
  const text = `${authorName} ${authorHandle} ${tweetText}`.toLowerCase()
  
  // Common tags based on content
  const tagMap = {
    'ai': ['ai', 'artificial-intelligence'],
    'crypto': ['crypto', 'blockchain'],
    'bitcoin': ['bitcoin', 'crypto'],
    'ethereum': ['ethereum', 'crypto'],
    'defi': ['defi', 'crypto'],
    'wallet': ['wallet', 'crypto'],
    'tech': ['technology'],
    'software': ['software', 'tech'],
    'programming': ['programming', 'tech'],
    'machine learning': ['machine-learning', 'ai'],
    'ml': ['machine-learning', 'ai']
  }
  
  for (const [keyword, relatedTags] of Object.entries(tagMap)) {
    if (text.includes(keyword)) {
      tags.push(...relatedTags)
    }
  }
  
  // Remove duplicates and return
  return [...new Set(tags)]
}

// Function to update article in Supabase with enhanced content
async function updateArticleWithEnhancedContent(article: any) {
  try {
    // Generate enhanced content
    const enhancedContent = generateArticleContent(article)
    const category = categorizeContent(article.author_name || '', article.author_handle || '', article.content || '')
    const tags = extractTags(article.author_name || '', article.author_handle || '', article.content || '')
    
    const updateData = {
      title: enhancedContent.title,
      content: enhancedContent.content,
      excerpt: enhancedContent.excerpt,
      category: category,
      tags: tags,
      updated_at: new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('tweet_id', article.tweet_id)
    
    if (error) {
      console.error('Error updating article:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error updating article with enhanced content:', error)
    return false
  }
}

// Main function to update articles with enhanced content
async function updateArticlesWithEnhancedContent() {
  try {
    // Get all articles that need content enhancement
    const { data: articles, error } = await supabase
      .from('articles')
      .select('tweet_id, article_url, title, content, author_name, author_handle')
      .not('article_url', 'is', null)
      .like('content', 'https://t.co/%')
    
    if (error) {
      console.error('Error fetching articles:', error)
      return
    }
    
    if (!articles || articles.length === 0) {
      console.log('No articles found that need content updates')
      return
    }
    
    console.log(`Found ${articles.length} articles to update with enhanced content`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]
      console.log(`\nProcessing ${i + 1}/${articles.length}: Tweet ${article.tweet_id}`)
      console.log(`Author: ${article.author_name} (${article.author_handle})`)
      console.log(`Article URL: ${article.article_url}`)
      
      // Generate enhanced content
      const enhancedContent = generateArticleContent(article)
      const category = categorizeContent(article.author_name || '', article.author_handle || '', article.content || '')
      const tags = extractTags(article.author_name || '', article.author_handle || '', article.content || '')
      
      console.log(`Generated title: ${enhancedContent.title}`)
      console.log(`Category: ${category}`)
      console.log(`Tags: ${tags.join(', ')}`)
      console.log(`Content length: ${enhancedContent.content.length} characters`)
      
      // Update article in Supabase
      const updated = await updateArticleWithEnhancedContent(article)
      if (updated) {
        console.log('Successfully updated article with enhanced content')
        successCount++
      } else {
        console.error('Failed to update article')
        errorCount++
      }
    }
    
    console.log(`\n=== Update Complete ===`)
    console.log(`Successfully updated: ${successCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log(`Total: ${articles.length}`)
    
  } catch (error) {
    console.error('Error in main function:', error)
  }
}

// Run the script
updateArticlesWithEnhancedContent().catch(console.error)
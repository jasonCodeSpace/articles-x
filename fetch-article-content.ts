import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const rapidApiKey = process.env.RAPIDAPI_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to extract article ID from URL
function extractArticleId(url: string): string | null {
  const match = url.match(/\/article\/(\d+)/)
  return match ? match[1] : null
}

// Function to fetch article content using RapidAPI
async function fetchArticleContent(articleId: string) {
  const url = 'https://twitter-api45.p.rapidapi.com/article.php'
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': rapidApiKey,
      'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
    }
  }

  try {
    const response = await fetch(`${url}?id=${articleId}`, options)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching article ${articleId}:`, error)
    return null
  }
}

// Function to process article data
function processArticleData(data: any) {
  try {
    if (!data) {
      return null
    }

    // Extract article information
    const title = data.title || ''
    const content = data.content || data.text || ''
    const excerpt = data.excerpt || data.description || (content.length > 200 ? content.substring(0, 200) + '...' : content)
    const featuredImageUrl = data.image || data.cover_image || data.featured_image || null
    const publishedAt = data.published_at || data.created_at || null

    return {
      title,
      content,
      excerpt,
      featured_image_url: featuredImageUrl,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : null
    }
  } catch (error) {
    console.error('Error processing article data:', error)
    return null
  }
}

// Function to update article in Supabase
async function updateArticleInSupabase(tweetId: string, articleData: any) {
  try {
    const { error } = await supabase
      .from('articles')
      .update({
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.excerpt,
        featured_image_url: articleData.featured_image_url,
        published_at: articleData.published_at,
        updated_at: new Date().toISOString()
      })
      .eq('tweet_id', tweetId)

    if (error) {
      console.error('Error updating article:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error updating article in Supabase:', error)
    return false
  }
}

// Main function to fetch and update articles
async function fetchAndUpdateArticles() {
  try {
    // Get all articles that have article URLs but limited content
    const { data: articles, error } = await supabase
      .from('articles')
      .select('tweet_id, article_url, title, content')
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

    console.log(`Found ${articles.length} articles to update`)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]
      console.log(`\nProcessing ${i + 1}/${articles.length}: Tweet ${article.tweet_id}`)
      console.log(`Article URL: ${article.article_url}`)

      // Extract article ID from URL
      const articleId = extractArticleId(article.article_url)
      if (!articleId) {
        console.error('Could not extract article ID from URL')
        errorCount++
        continue
      }

      console.log(`Article ID: ${articleId}`)

      // Fetch article content
      const articleData = await fetchArticleContent(articleId)
      if (!articleData) {
        console.error('Failed to fetch article content')
        errorCount++
        continue
      }

      // Process article data
      const processedData = processArticleData(articleData)
      if (!processedData) {
        console.error('Failed to process article data')
        errorCount++
        continue
      }

      console.log(`Article title: ${processedData.title}`)
      console.log(`Content length: ${processedData.content.length} characters`)

      // Update article in Supabase
      const updated = await updateArticleInSupabase(article.tweet_id, processedData)
      if (updated) {
        console.log('Successfully updated article')
        successCount++
      } else {
        console.error('Failed to update article')
        errorCount++
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
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
fetchAndUpdateArticles().catch(console.error)
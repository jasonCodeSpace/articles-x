import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const rapidApiKey = process.env.RAPIDAPI_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to extract article content using Article Content Extractor API
async function extractArticleContent(articleUrl: string) {
  const url = 'https://article-content-extractor.p.rapidapi.com/extract'
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-rapidapi-key': rapidApiKey,
      'x-rapidapi-host': 'article-content-extractor.p.rapidapi.com'
    },
    body: JSON.stringify({
      url: articleUrl
    })
  }

  try {
    console.log(`Extracting content from: ${articleUrl}`)
    const response = await fetch(url, options)
    
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return null
    }
    
    const data = await response.json()
    console.log('Extraction successful')
    return data
  } catch (error) {
    console.error(`Error extracting article content:`, error)
    return null
  }
}

// Function to process extracted article data
function processExtractedData(data: any) {
  try {
    if (!data) {
      return null
    }

    // Extract article information from the API response
    const title = data.title || data.headline || ''
    const content = data.content || data.text || data.body || ''
    const excerpt = data.excerpt || data.description || data.summary || 
                   (content.length > 300 ? content.substring(0, 300) + '...' : content)
    const featuredImageUrl = data.image || data.featured_image || data.top_image || null
    const publishedAt = data.published_date || data.date_published || data.publish_date || null
    const author = data.author || data.authors || null

    // Clean up content - remove extra whitespace and normalize
    const cleanContent = content.replace(/\s+/g, ' ').trim()
    const cleanExcerpt = excerpt.replace(/\s+/g, ' ').trim()

    return {
      title: title.trim(),
      content: cleanContent,
      excerpt: cleanExcerpt,
      featured_image_url: featuredImageUrl,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
      author: typeof author === 'string' ? author : (Array.isArray(author) ? author.join(', ') : null)
    }
  } catch (error) {
    console.error('Error processing extracted data:', error)
    return null
  }
}

// Function to update article in Supabase
async function updateArticleInSupabase(tweetId: string, articleData: any) {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only update fields that have meaningful content
    if (articleData.title && articleData.title.length > 0) {
      updateData.title = articleData.title
    }
    if (articleData.content && articleData.content.length > 0) {
      updateData.content = articleData.content
    }
    if (articleData.excerpt && articleData.excerpt.length > 0) {
      updateData.excerpt = articleData.excerpt
    }
    if (articleData.featured_image_url) {
      updateData.featured_image_url = articleData.featured_image_url
    }
    if (articleData.published_at) {
      updateData.published_at = articleData.published_at
    }
    if (articleData.author) {
      updateData.author_name = articleData.author
    }

    const { error } = await supabase
      .from('articles')
      .update(updateData)
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

// Main function to extract and update articles
async function extractAndUpdateArticles() {
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
    console.log('Processing with 10-second delays to avoid rate limiting...')

    let successCount = 0
    let errorCount = 0

    // Process only first 5 articles to avoid rate limiting
    const articlesToProcess = articles.slice(0, 5)
    console.log(`Processing first ${articlesToProcess.length} articles...`)
    
    for (let i = 0; i < articlesToProcess.length; i++) {
       const article = articlesToProcess[i]
       console.log(`\nProcessing ${i + 1}/${articlesToProcess.length}: Tweet ${article.tweet_id}`)
      console.log(`Article URL: ${article.article_url}`)

      // Extract article content using the extractor API
      const extractedData = await extractArticleContent(article.article_url)
      if (!extractedData) {
        console.error('Failed to extract article content')
        errorCount++
        continue
      }

      // Process extracted data
      const processedData = processExtractedData(extractedData)
      if (!processedData) {
        console.error('Failed to process extracted data')
        errorCount++
        continue
      }

      console.log(`Article title: ${processedData.title}`)
      console.log(`Content length: ${processedData.content.length} characters`)
      console.log(`Excerpt length: ${processedData.excerpt.length} characters`)
      if (processedData.featured_image_url) {
        console.log(`Featured image: ${processedData.featured_image_url}`)
      }
      if (processedData.author) {
        console.log(`Author: ${processedData.author}`)
      }

      // Update article in Supabase
      const updated = await updateArticleInSupabase(article.tweet_id, processedData)
      if (updated) {
        console.log('Successfully updated article')
        successCount++
      } else {
        console.error('Failed to update article')
        errorCount++
      }

      // Add longer delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 10000)) // 10 seconds delay
    }

    console.log(`\n=== Extraction Complete ===`)
    console.log(`Successfully updated: ${successCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log(`Total: ${articles.length}`)

  } catch (error) {
    console.error('Error in main function:', error)
  }
}

// Run the script
extractAndUpdateArticles().catch(console.error)
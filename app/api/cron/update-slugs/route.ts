import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateSlugFromTitle } from '@/lib/url-utils'

/**
 * Update slugs for Chinese articles based on their English titles
 * This endpoint should be called every 15 minutes via cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    
    // Get the most recent 100 Chinese articles that have English titles
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, title_english, slug, language')
      .eq('language', 'zh')
      .not('title_english', 'is', null)
      .not('title_english', 'eq', '')
      .order('tweet_published_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching Chinese articles:', error)
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({ 
        message: 'No Chinese articles with English titles found',
        updated: 0 
      })
    }

    console.log(`Found ${articles.length} Chinese articles to process`)
    
    let updatedCount = 0
    const errors: string[] = []

    // Process each article
    for (const article of articles) {
      try {
        // Generate new slug from English title
        const newSlug = generateSlugFromTitle(article.title_english)
        
        // Only update if the slug is different and valid
        if (newSlug && newSlug !== article.slug && newSlug.length > 0) {
          const { error: updateError } = await supabase
            .from('articles')
            .update({ slug: newSlug })
            .eq('id', article.id)

          if (updateError) {
            console.error(`Error updating article ${article.id}:`, updateError)
            errors.push(`Failed to update article ${article.id}: ${updateError.message}`)
          } else {
            console.log(`Updated article ${article.id}: "${article.title}" slug: ${article.slug} -> ${newSlug}`)
            updatedCount++
          }
        }
        
        // Add small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (articleError) {
        console.error(`Error processing article ${article.id}:`, articleError)
        errors.push(`Error processing article ${article.id}: ${articleError}`)
      }
    }

    console.log(`Slug update completed. Updated ${updatedCount} articles.`)
    
    return NextResponse.json({
      message: 'Slug update completed',
      processed: articles.length,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error in slug update cron job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Allow GET requests for manual testing
 */
export async function GET(request: NextRequest) {
  return POST(request)
}
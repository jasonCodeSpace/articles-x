import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!CRON_SECRET) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      )
    }

    const supabase = createServiceClient()

    // Get articles with their published dates to categorize by time
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, article_published_at, tag')
      .not('article_published_at', 'is', null)
      .order('article_published_at', { ascending: false })
      .limit(400) // Process recent articles

    if (fetchError) {
      console.error('Error fetching articles:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch articles', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles need tag updates',
        updatedCount: 0
      })
    }

    let updatedCount = 0
    const errors: string[] = []

    // Process each article
    for (const article of articles) {
      try {
        // Generate time-based tags
        const timeTag = generateTimeBasedTag(article.article_published_at)
        
        if (timeTag) {
          const { error: updateError } = await supabase
            .from('articles')
            .update({ tag: timeTag })
            .eq('id', article.id)

          if (updateError) {
            errors.push(`Failed to update article ${article.id}: ${updateError.message}`)
          } else {
            updatedCount++
          }
        }
      } catch (error) {
        errors.push(`Error processing article ${article.id}: ${error}`)
      }
    }

    console.log(`Updated tags for ${updatedCount} articles`)
    if (errors.length > 0) {
      console.error('Errors during tag updates:', errors)
    }

    return NextResponse.json({
      success: true,
      message: `Updated tags for ${updatedCount} articles`,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Unexpected error during tag updates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate time-based tags
function generateTimeBasedTag(articlePublishedAt: string): string | null {
  if (!articlePublishedAt) return null
  
  const publishedDate = new Date(articlePublishedAt)
  const now = new Date()
  const diffInMs = now.getTime() - publishedDate.getTime()
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
  
  if (diffInDays <= 1) {
    return 'Day'
  } else if (diffInDays <= 7) {
    return 'Week'
  } else {
    return 'History'
  }
}

// POST method for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
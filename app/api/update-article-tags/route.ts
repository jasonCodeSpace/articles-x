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

    // Get articles that need tag updates (articles without tags or with outdated tags)
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, content, category, tags')
      .or('tags.is.null,tags.eq.{}')
      .limit(50) // Process in batches

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
        // Generate tags based on title, content, and category
        const tags = generateTagsFromContent(article.title, article.content, article.category)
        
        if (tags.length > 0) {
          const { error: updateError } = await supabase
            .from('articles')
            .update({ tags })
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

// Helper function to generate tags from content
function generateTagsFromContent(title: string, content: string, category: string): string[] {
  const tags: Set<string> = new Set()
  
  // Add category as a tag if it exists
  if (category && category.trim()) {
    tags.add(category.toLowerCase())
  }
  
  // Common tech keywords to look for
  const techKeywords = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'node', 'nodejs',
    'python', 'java', 'golang', 'rust', 'php', 'ruby', 'swift', 'kotlin',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'cloud',
    'api', 'rest', 'graphql', 'database', 'sql', 'nosql', 'mongodb', 'postgresql',
    'frontend', 'backend', 'fullstack', 'devops', 'ci/cd', 'testing',
    'machine learning', 'ai', 'artificial intelligence', 'data science',
    'blockchain', 'web3', 'crypto', 'nft',
    'mobile', 'ios', 'android', 'flutter', 'react native',
    'security', 'cybersecurity', 'privacy',
    'startup', 'business', 'product', 'design', 'ux', 'ui'
  ]
  
  const text = `${title} ${content}`.toLowerCase()
  
  // Find matching keywords
  for (const keyword of techKeywords) {
    if (text.includes(keyword.toLowerCase())) {
      tags.add(keyword)
    }
  }
  
  // Limit to 10 tags maximum
  return Array.from(tags).slice(0, 10)
}

// POST method for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
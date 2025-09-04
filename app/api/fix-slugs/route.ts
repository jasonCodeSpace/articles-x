import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSlugFromTitle, generateShortId } from '@/lib/url-utils'

/**
 * Regenerate slug from title using the same logic as generateSlugFromTitle
 */
function regenerateSlugFromTitle(title: string, articleId: string): string {
  if (!title || title.trim().length === 0) {
    return `article--${generateShortId(articleId)}`
  }
  
  const titleSlug = generateSlugFromTitle(title)
  const shortId = generateShortId(articleId)
  
  return `${titleSlug}--${shortId}`
}

const CRON_SECRET = process.env.CRON_SECRET
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const querySecret = request.nextUrl.searchParams.get('secret')
  
  if (!CRON_SECRET) {
    console.error('CRON_SECRET not configured')
    return false
  }
  
  return (authHeader === `Bearer ${CRON_SECRET}`) || (querySecret === CRON_SECRET)
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('🔧 Starting slug regeneration process...')
    
    // Find articles with potentially problematic slugs, ordered by publication date
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, slug, article_published_at')
      .not('title', 'is', null)
      .order('article_published_at', { ascending: false })
      .limit(200)
    
    if (fetchError) {
      console.error('Error fetching articles:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      )
    }

    // Filter articles that need slug regeneration
    const filteredArticles = articles.filter((article: { id: string; slug: string; title?: string }) => {
      if (!article.slug || !article.title) return false
      
      // Remove ID suffix to check base slug
      const baseSlug = article.slug.split('--')[0]
      
      // Check if slug has issues: no hyphens and long, or very long segments
      return (baseSlug.length > 15 && !baseSlug.includes('-')) || 
             baseSlug.split('-').some(segment => segment.length > 20)
    }) || []

    if (filteredArticles.length === 0) {
      console.log('✅ No problematic slugs found')
      return NextResponse.json({
        message: 'No problematic slugs found',
        processed: 0
      })
    }

    console.log(`📋 Found ${filteredArticles.length} articles with problematic slugs`)
    
    let successCount = 0
    let errorCount = 0
    
    // Process each article (limit to 50 to avoid timeouts)
    const articlesToProcess = filteredArticles.slice(0, 50)
    for (const article of articlesToProcess) {
      try {
        if (!article.title || article.title.trim().length === 0) {
          console.log(`⚠️ Skipping article ${article.id} - no title`)
          continue
        }

        // Regenerate slug from title
        const newSlug = regenerateSlugFromTitle(article.title, article.id)
        
        // Only update if the slug actually changed
        if (newSlug !== article.slug) {
          const { error: updateError } = await supabase
            .from('articles')
            .update({ slug: newSlug })
            .eq('id', article.id)
            
          if (updateError) {
            console.error(`❌ Error updating article ${article.id}:`, updateError)
            errorCount++
          } else {
            console.log(`✅ Regenerated slug: ${article.slug} -> ${newSlug}`)
            successCount++
          }
        } else {
          console.log(`ℹ️ No changes needed for article ${article.id}: ${article.slug}`)
        }
      } catch (err) {
        console.error(`❌ Error processing article ${article.id}:`, err)
        errorCount++
      }
    }
    
    const result = {
      message: 'Slug regeneration process completed',
      processed: successCount + errorCount,
      successful: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    }
    
    console.log('🎉 Slug regeneration process completed:', result)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Slug fix process error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Get articles with potentially problematic slugs, ordered by publication date
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, slug, title, article_published_at')
      .not('title', 'is', null)
      .order('article_published_at', { ascending: false })
      .limit(200)
    
    if (error) {
      console.error('Error fetching articles:', error)
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
    }
    
    // Filter articles that need slug regeneration
    const filteredArticles = articles?.filter((article: { id: string; slug: string; title?: string }) => {
      if (!article.slug || !article.title) return false
      
      // Remove ID suffix to check base slug
      const baseSlug = article.slug.split('--')[0]
      
      // Check if slug has issues: no hyphens and long, or very long segments
      return (baseSlug.length > 15 && !baseSlug.includes('-')) || 
             baseSlug.split('-').some(segment => segment.length > 20)
    }) || []
    
    if (filteredArticles.length === 0) {
      return NextResponse.json({ message: 'No articles need slug fixing', fixed: 0 })
    }
    
    let fixedCount = 0
    const updates = []
    
    for (const article of filteredArticles) {
      if (!article.title || article.title.trim().length === 0) {
        continue // Skip articles without titles
      }
      
      const originalSlug = article.slug
      const newSlug = regenerateSlugFromTitle(article.title, article.id)
      
      if (newSlug !== originalSlug) {
        updates.push({
          id: article.id,
          slug: newSlug,
          originalSlug: originalSlug
        })
        fixedCount++
      }
    }
    
    // Batch update the slugs
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('articles')
          .update({ slug: update.slug })
          .eq('id', update.id)
        
        if (updateError) {
          console.error(`Error updating article ${update.id}:`, updateError)
        } else {
          console.log(`Updated slug for article ${update.id}: ${update.originalSlug} -> ${update.slug}`)
        }
      }
    }
    
    return NextResponse.json({
      message: `Fixed ${fixedCount} slugs`,
      fixed: fixedCount,
      total: filteredArticles.length,
      checked: articles?.length || 0
    })
    
  } catch (error) {
    console.error('Error in fix-slugs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
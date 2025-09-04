import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSlugFromTitle } from '@/lib/url-utils'

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

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🔧 Starting slug fix process...')
    
    // Find articles with overly long slugs (more than 80 characters)
    const { data: longSlugArticles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, slug')
      .filter('slug', 'like', '%')
      .limit(200) // Get more articles to filter client-side
    
    if (fetchError) {
      console.error('Error fetching articles with long slugs:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      )
    }

    // Filter articles with slugs longer than 80 characters
    const filteredArticles = longSlugArticles?.filter(article => 
      article.slug && article.slug.length > 80
    ) || []

    if (filteredArticles.length === 0) {
      console.log('✅ No long slugs found')
      return NextResponse.json({
        message: 'No long slugs found',
        processed: 0
      })
    }

    console.log(`📋 Found ${filteredArticles.length} articles with long slugs`)
    
    let successCount = 0
    let errorCount = 0
    
    // Process each article (limit to 50 to avoid timeouts)
    const articlesToProcess = filteredArticles.slice(0, 50)
    for (const article of articlesToProcess) {
      try {
        if (!article.title || article.title.trim() === '') {
          console.log(`⚠️ Skipping article ${article.id} - no title`)
          continue
        }

        // Generate new slug from title (max 50 chars) + short ID
        const baseSlug = generateSlugFromTitle(article.title)
        const shortId = article.id.slice(-6) // Use last 6 chars of UUID
        const newSlug = `${baseSlug}--${shortId}`
        
        // Ensure the new slug is not too long
        if (newSlug.length > 80) {
          // If still too long, truncate the base slug
          const maxBaseLength = 80 - 8 // 8 chars for '--' + shortId
          const truncatedBase = baseSlug.substring(0, maxBaseLength)
          const finalSlug = `${truncatedBase}--${shortId}`
          
          const { error: updateError } = await supabase
            .from('articles')
            .update({ slug: finalSlug })
            .eq('id', article.id)
            
          if (updateError) {
            console.error(`❌ Error updating article ${article.id}:`, updateError)
            errorCount++
          } else {
            console.log(`✅ Fixed long slug: ${article.slug} -> ${finalSlug}`)
            successCount++
          }
        } else {
          const { error: updateError } = await supabase
            .from('articles')
            .update({ slug: newSlug })
            .eq('id', article.id)
            
          if (updateError) {
            console.error(`❌ Error updating article ${article.id}:`, updateError)
            errorCount++
          } else {
            console.log(`✅ Fixed long slug: ${article.slug} -> ${newSlug}`)
            successCount++
          }
        }
      } catch (err) {
        console.error(`❌ Error processing article ${article.id}:`, err)
        errorCount++
      }
    }
    
    const result = {
      message: 'Slug fix process completed',
      processed: successCount + errorCount,
      successful: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    }
    
    console.log('🎉 Slug fix process completed:', result)
    
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
  return GET(request)
}
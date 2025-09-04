import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Fix slugs that have words concatenated without hyphens
 * e.g., "intuitionrevolutionizingweb" -> "intuition-revolutionizing-web"
 */
function fixConcatenatedWords(slug: string): string {
  // Split slug into base part and ID suffix (if exists)
  const parts = slug.split('--')
  const baseSlug = parts[0]
  const idSuffix = parts[1] ? `--${parts[1]}` : ''
  
  // If already has hyphens, return as is
  if (baseSlug.includes('-')) {
    return slug
  }
  
  // Only process if the base slug is long enough to likely contain concatenated words
  if (baseSlug.length > 15) {
    // Common English words that might appear in tech/AI contexts
    const commonWords = [
      'intuition', 'revolution', 'revolutionizing', 'web', 'infrastructure', 
      'for', 'the', 'age', 'of', 'ai', 'agents', 'artificial', 'intelligence',
      'machine', 'learning', 'deep', 'neural', 'network', 'data', 'science',
      'technology', 'innovation', 'digital', 'future', 'automation',
      'algorithm', 'computing', 'software', 'development', 'programming',
      'application', 'platform', 'system', 'framework', 'solution',
      'service', 'cloud', 'database', 'security', 'privacy', 'blockchain',
      'crypto', 'quantum', 'virtual', 'reality', 'augmented', 'mobile',
      'internet', 'online', 'digital', 'smart', 'connected', 'iot',
      'big', 'analytics', 'business', 'enterprise', 'startup', 'tech',
      'innovation', 'disruption', 'transformation', 'evolution'
    ]
    
    let result = ''
    let remaining = baseSlug.toLowerCase()
    
    while (remaining.length > 0) {
      let matched = false
      
      // Try to match common words from longest to shortest
      const sortedWords = commonWords.sort((a, b) => b.length - a.length)
      
      for (const word of sortedWords) {
        if (remaining.startsWith(word)) {
          result += (result ? '-' : '') + word
          remaining = remaining.substring(word.length)
          matched = true
          break
        }
      }
      
      // If no word matched, take a reasonable chunk
      if (!matched) {
        const chunkSize = Math.min(6, remaining.length)
        const chunk = remaining.substring(0, chunkSize)
        result += (result ? '-' : '') + chunk
        remaining = remaining.substring(chunkSize)
      }
    }
    
    return result + idSuffix
  }
  
  return slug
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

    const supabase = await createClient()
    
    console.log('🔧 Starting slug fix process for concatenated words...')
    
    // Find articles with potentially concatenated words in slugs
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, slug')
      .filter('slug', 'like', '%')
      .limit(200) // Get articles to check for concatenated words
    
    if (fetchError) {
      console.error('Error fetching articles:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      )
    }

    // Filter articles that have concatenated words (long words without hyphens)
    const filteredArticles = articles.filter((article: { id: string; slug: string; title?: string }) => {
      if (!article.slug) return false
      
      // Remove ID suffix to check base slug
      const baseSlug = article.slug.split('--')[0]
      
      // Check if slug has long segments without hyphens (indicating concatenated words)
      return baseSlug.length > 15 && !baseSlug.includes('-')
    }) || []

    if (filteredArticles.length === 0) {
      console.log('✅ No concatenated word slugs found')
      return NextResponse.json({
        message: 'No concatenated word slugs found',
        processed: 0
      })
    }

    console.log(`📋 Found ${filteredArticles.length} articles with concatenated words`)
    
    let successCount = 0
    let errorCount = 0
    
    // Process each article (limit to 50 to avoid timeouts)
    const articlesToProcess = filteredArticles.slice(0, 50)
    for (const article of articlesToProcess) {
      try {
        if (!article.slug) {
          console.log(`⚠️ Skipping article ${article.id} - no slug`)
          continue
        }

        // Fix concatenated words in the existing slug
        const fixedSlug = fixConcatenatedWords(article.slug)
        
        // Only update if the slug actually changed
        if (fixedSlug !== article.slug) {
          const { error: updateError } = await supabase
            .from('articles')
            .update({ slug: fixedSlug })
            .eq('id', article.id)
            
          if (updateError) {
            console.error(`❌ Error updating article ${article.id}:`, updateError)
            errorCount++
          } else {
            console.log(`✅ Fixed concatenated words: ${article.slug} -> ${fixedSlug}`)
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
      message: 'Concatenated words fix process completed',
      processed: successCount + errorCount,
      successful: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    }
    
    console.log('🎉 Concatenated words fix process completed:', result)
    
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
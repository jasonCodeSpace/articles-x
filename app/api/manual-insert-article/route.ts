import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createTwitterClient } from '@/lib/services/twitter/client'

// Verify password for manual article insertion
const MANUAL_INSERT_PASSWORD = '091919$'
const ALLOWED_EMAIL = 'jcwang0919@gmail.com'

interface ArticleSubmission {
  url: string
  password: string
}

// Generate slug from title (copied from url-utils)
function generateSlug(title: string): string {
  if (!title) return 'untitled'

  return title
    .toLowerCase()
    .replace(/[\s\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
}

export async function POST(request: NextRequest) {
  try {
    const body: ArticleSubmission = await request.json()
    const { url, password } = body

    // Validate password
    if (password !== MANUAL_INSERT_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Validate URL format
    if (!url || !url.startsWith('https://x.com/') && !url.startsWith('https://twitter.com/')) {
      return NextResponse.json(
        { error: 'Invalid URL. Must be an X (Twitter) article URL' },
        { status: 400 }
      )
    }

    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify user token and email
    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Check if user is allowed
    if (user.email !== ALLOWED_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized user' },
        { status: 403 }
      )
    }

    // Extract tweet ID from URL
    // Format: https://x.com/username/article/1234567890 or https://x.com/username/status/1234567890
    const urlMatch = url.match(/x\.com\/[^\/]+\/(?:article|status)\/(\d+)/)
    if (!urlMatch) {
      return NextResponse.json(
        { error: 'Invalid X article URL format' },
        { status: 400 }
      )
    }

    const tweetId = urlMatch[1]

    // Check if article already exists
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id, source_type, slug')
      .eq('tweet_id', tweetId)
      .single()

    if (existingArticle) {
      return NextResponse.json(
        {
          error: 'Article already exists',
          articleId: existingArticle.id,
          slug: existingArticle.slug,
          sourceType: existingArticle.source_type
        },
        { status: 409 }
      )
    }

    // Fetch tweet data from Twitter API
    let tweetData: any = null
    try {
      const twitterClient = createTwitterClient()
      tweetData = await twitterClient.fetchTweet(tweetId)
    } catch (twitterError) {
      console.error('Failed to fetch tweet:', twitterError)
      return NextResponse.json(
        { error: 'Failed to fetch article from Twitter. Please try again.' },
        { status: 500 }
      )
    }

    if (!tweetData) {
      return NextResponse.json(
        { error: 'Tweet not found or private' },
        { status: 404 }
      )
    }

    // Extract article URL from tweet if it contains a link
    const articleUrl = tweetData.entities?.urls?.[0]?.expanded_url || url

    // Generate slug from title
    const baseSlug = generateSlug(tweetData.text?.substring(0, 100) || `manual-${tweetId}`)
    const uniqueSlug = `${baseSlug}-${tweetId.substring(0, 8)}`

    // Create article with fetched data
    const { data: newArticle, error: insertError } = await supabase
      .from('articles')
      .insert({
        tweet_id: tweetId,
        article_url: articleUrl,
        source_type: 'manual',
        manually_inserted_at: new Date().toISOString(),
        title: tweetData.text?.substring(0, 200) || 'Manual Insert',
        slug: uniqueSlug,
        content: tweetData.text || '',
        author_name: tweetData.author?.name || 'Unknown',
        author_handle: tweetData.author?.username || url.match(/x\.com\/([^\/]+)/)?.[1] || 'unknown',
        author_avatar: tweetData.author?.profile_image_url_https || null,
        language: 'en',
        indexed: true, // Allow indexing
        tweet_published_at: tweetData.created_at || new Date().toISOString(),
        article_published_at: tweetData.created_at || new Date().toISOString(),
        tweet_views: tweetData.public_metrics?.view_count || 0,
        tweet_likes: tweetData.public_metrics?.like_count || 0,
        tweet_retweets: tweetData.public_metrics?.retweet_count || 0,
        tweet_replies: tweetData.public_metrics?.reply_count || 0,
        tweet_bookmarks: tweetData.public_metrics?.bookmark_count || 0,
        tweet_text: tweetData.text || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, slug')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create article', details: insertError.message },
        { status: 500 }
      )
    }

    // Revalidate pages
    revalidatePath('/trending')
    revalidatePath('/')
    revalidatePath(`/article/${uniqueSlug}`)

    return NextResponse.json({
      success: true,
      articleId: newArticle.id,
      slug: newArticle.slug,
      tweetId,
      message: 'Article inserted successfully'
    })

  } catch (error) {
    console.error('Manual article insertion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

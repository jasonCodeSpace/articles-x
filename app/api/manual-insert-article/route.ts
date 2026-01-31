import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// Verify password for manual article insertion
const MANUAL_INSERT_PASSWORD = '091919$'
const ALLOWED_EMAIL = 'jcwang0919@gmail.com'

interface ArticleSubmission {
  url: string
  password: string
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
    const authorHandle = url.match(/x\.com\/([^\/]+)/)?.[1] || 'unknown'

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

    // Create a placeholder article for Racknerd to process
    const { data: newArticle, error: insertError } = await supabase
      .from('articles')
      .insert({
        tweet_id: tweetId,
        article_url: url,
        source_type: 'manual',
        manually_inserted_at: new Date().toISOString(),
        status: 'pending',
        title: 'Processing...',
        slug: `manual-${tweetId}`,
        content: '',
        author_name: 'Unknown',
        author_handle: authorHandle,
        language: 'en',
        indexed: false, // Will be indexed after processing
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
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

    return NextResponse.json({
      success: true,
      articleId: newArticle.id,
      tweetId,
      message: 'Article submitted for processing'
    })

  } catch (error) {
    console.error('Manual article insertion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

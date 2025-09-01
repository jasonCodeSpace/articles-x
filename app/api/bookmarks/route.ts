import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch user's bookmarked articles
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's bookmarked articles with full article data
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select(`
        id,
        created_at,
        articles (
          id,
          title,
          slug,
          content,
          excerpt,
          author_name,
          author_handle,
          author_avatar,
          featured_image_url,
          image,
          article_published_at,
          created_at,
          tags,
          category,
          article_url,
          tweet_id,
          tweet_text,
          tweet_published_at,
          tweet_views,
          tweet_replies,
          tweet_retweets,
          tweet_likes,
          tweet_bookmarks,
          article_preview_text,
          full_article_content,
          updated_at,
          summary_chinese,
          summary_english,
          summary_generated_at,
          language,
          title_english,
          article_preview_text_english,
          full_article_content_english,
          tag
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookmarks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookmarks' },
        { status: 500 }
      )
    }

    // Extract articles from bookmarks
    const articles = bookmarks?.map(bookmark => bookmark.articles).filter(Boolean) || []

    return NextResponse.json({
      bookmarks: articles,
      count: articles.length
    })

  } catch (error) {
    console.error('Error in bookmarks GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add/remove bookmark
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { articleId, action } = await request.json()

    if (!articleId || !action) {
      return NextResponse.json(
        { error: 'Article ID and action are required' },
        { status: 400 }
      )
    }

    if (action === 'add') {
      // Add bookmark
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          article_id: articleId
        })
        .select()
        .single()

      if (error) {
        // Check if it's a duplicate constraint violation
        if (error.code === '23505') {
          return NextResponse.json(
            { message: 'Article already bookmarked', bookmarked: true },
            { status: 200 }
          )
        }
        console.error('Error adding bookmark:', error)
        return NextResponse.json(
          { error: 'Failed to add bookmark' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Article bookmarked successfully',
        bookmarked: true,
        bookmark: data
      })

    } else if (action === 'remove') {
      // Remove bookmark
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('article_id', articleId)

      if (error) {
        console.error('Error removing bookmark:', error)
        return NextResponse.json(
          { error: 'Failed to remove bookmark' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Bookmark removed successfully',
        bookmarked: false
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "add" or "remove"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in bookmarks POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET bookmark status for specific article
export async function GET_STATUS(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ bookmarked: false })
    }

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    // Check if article is bookmarked by user
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('article_id', articleId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking bookmark status:', error)
      return NextResponse.json({ bookmarked: false })
    }

    return NextResponse.json({
      bookmarked: !!data
    })

  } catch (error) {
    console.error('Error in bookmark status check:', error)
    return NextResponse.json({ bookmarked: false })
  }
}

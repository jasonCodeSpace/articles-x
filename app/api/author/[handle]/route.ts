import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params
    // Decode handle since it's URL-encoded in the link (e.g., %40 for @)
    const decodedHandle = decodeURIComponent(handle)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '9')
    const offset = (page - 1) * limit

    if (!decodedHandle) {
      return NextResponse.json(
        { message: 'Author handle is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: object) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: object) {
            cookieStore.set(name, '', options)
          },
        },
      }
    )

    // First, get total count of articles for this author
    const { count: totalCount, error: countError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('author_handle', decodedHandle)

    if (countError) {
      console.error('Error counting articles:', countError)
      return NextResponse.json(
        { message: 'Error counting articles' },
        { status: 500 }
      )
    }

    // Fetch articles by the author with pagination
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select(
        'id, title, article_preview_text, image, author_name, author_handle, author_avatar, article_published_at, tweet_id, language, category, slug, tweet_likes, tweet_retweets, tweet_replies'
      )
      .eq('author_handle', decodedHandle)
      .order('article_published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (articlesError) {
      console.error('Error fetching articles:', articlesError)
      return NextResponse.json(
        { message: 'Error fetching articles' },
        { status: 500 }
      )
    }

    if (!articlesData || articlesData.length === 0) {
      return NextResponse.json(
        { message: 'Author not found or has no articles' },
        { status: 404 }
      )
    }

    // Get author info from the first article
    const firstArticle = articlesData[0]
    const authorData = {
      username: firstArticle.author_handle,
      full_name: firstArticle.author_name,
      avatar_url: firstArticle.author_avatar,
      articleCount: articlesData.length
    }

    // Return articles in the same format as the main articles page
    // This ensures consistency with the ArticleCard component expectations
    const transformedArticles = articlesData.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      author_name: article.author_name,
      author_handle: article.author_handle,
      author_avatar: article.author_avatar,
      image: article.image,
      article_published_at: article.article_published_at,
      created_at: article.article_published_at, // Use published date as created date
      tags: [], // Default empty tags array
      category: article.category,
      tweet_id: article.tweet_id,
      tweet_views: 0, // Default value
      tweet_replies: article.tweet_replies || 0,
      tweet_retweets: article.tweet_retweets || 0,
      tweet_likes: article.tweet_likes || 0,
      tweet_bookmarks: 0, // Default value
      article_preview_text: article.article_preview_text,
      language: article.language
    }))

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({ 
      author: authorData, 
      articles: transformedArticles,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount || 0,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
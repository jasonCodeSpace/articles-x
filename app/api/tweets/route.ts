import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page
    const listId = searchParams.get('list_id')
    const authorHandle = searchParams.get('author_handle')
    const hasArticle = searchParams.get('has_article')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    const supabase = await createClient()
    
    // Build query
    let query = supabase
      .from('tweets')
      .select(`
        id,
        tweet_id,
        rest_id,
        author_handle,
        author_name,
        author_profile_image,
        tweet_text,
        created_at_twitter,
        has_article,
        article_url,
        article_title,
        article_excerpt,
        article_featured_image,
        article_rest_id,
        list_id,
        created_at,
        updated_at,
        title,
        slug,
        published_time,
        image,
        author_avatar,
        description,
        article_published_at,
        published_at,
        content,
        category
      `, { count: 'exact' })

    // Apply filters
    if (listId) {
      query = query.eq('list_id', listId)
    }
    
    if (authorHandle) {
      query = query.eq('author_handle', authorHandle)
    }
    
    if (hasArticle !== null && hasArticle !== undefined) {
      query = query.eq('has_article', hasArticle === 'true')
    }
    
    if (search) {
      query = query.or(`tweet_text.ilike.%${search}%,author_name.ilike.%${search}%,article_title.ilike.%${search}%`)
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'created_at_twitter', 'author_name', 'has_article', 'article_published_at', 'published_at']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
    const order = sortOrder === 'asc' ? 'asc' : 'desc'
    
    query = query.order(sortColumn, { ascending: order === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: tweets, error, count } = await query

    if (error) {
      console.error('Error fetching tweets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tweets' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      tweets: tweets || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        listId,
        authorHandle,
        hasArticle,
        search,
        sortBy: sortColumn,
        sortOrder: order,
      },
    })
  } catch (error) {
    console.error('Error in tweets API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get tweet statistics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action !== 'stats') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get overall statistics
    const [totalTweets, tweetsWithArticles, uniqueAuthors, uniqueLists] = await Promise.all([
      supabase.from('tweets').select('id', { count: 'exact', head: true }),
      supabase.from('tweets').select('id', { count: 'exact', head: true }).eq('has_article', true),
      supabase.from('tweets').select('author_handle', { count: 'exact', head: true }).not('author_handle', 'is', null),
      supabase.from('tweets').select('list_id', { count: 'exact', head: true }).not('list_id', 'is', null),
    ])

    // Get top authors by tweet count
    const { data: topAuthors } = await supabase
      .from('tweets')
      .select('author_handle, author_name, author_profile_image')
      .not('author_handle', 'is', null)
      .limit(10)

    // Group by author and count
    interface AuthorCount {
      author_handle: string
      author_name: string
      author_profile_image?: string
      count: number
    }

    interface TweetAuthor {
      author_handle: string
      author_name: string
      author_profile_image?: string
    }

    const authorCounts = topAuthors?.reduce((acc: Record<string, AuthorCount>, tweet: TweetAuthor) => {
      const handle = tweet.author_handle
      if (!acc[handle]) {
        acc[handle] = {
          author_handle: handle,
          author_name: tweet.author_name,
          author_profile_image: tweet.author_profile_image,
          count: 0,
        }
      }
      acc[handle].count++
      return acc
    }, {}) || {}

    const topAuthorsList = Object.values(authorCounts)
      .sort((a: AuthorCount, b: AuthorCount) => b.count - a.count)
      .slice(0, 10)

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: recentTweets } = await supabase
      .from('tweets')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())

    return NextResponse.json({
      stats: {
        totalTweets: totalTweets.count || 0,
        tweetsWithArticles: tweetsWithArticles.count || 0,
        uniqueAuthors: uniqueAuthors.count || 0,
        uniqueLists: uniqueLists.count || 0,
        recentActivity: recentTweets?.length || 0,
      },
      topAuthors: topAuthorsList,
    })
  } catch (error) {
    console.error('Error in tweets stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
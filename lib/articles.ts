import { createAnonClient } from '@/lib/supabase/server'
import { Article } from '@/components/article-card'

export type SortOption = 'newest' | 'oldest' | 'views_high' | 'views_low'

export interface FetchArticlesOptions {
  limit?: number
  sort?: SortOption
  search?: string
  category?: string
  language?: string
}

/**
 * Server-side function to fetch articles from Supabase
 */
export async function fetchArticles(options: FetchArticlesOptions = {}): Promise<Article[]> {
  const {
    limit = 200, // Optimized limit for fast loading
    sort = 'newest',
    search,
    category,
    language,
  } = options

  try {
    // Use anon client for ISR caching (doesn't require cookies)
    const supabase = createAnonClient()

    // Only select columns needed for article cards to reduce payload size
    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        title_english,
        slug,
        image,
        author_name,
        author_handle,
        author_avatar,
        article_published_at,
        updated_at,
        tweet_views,
        tweet_replies,
        tweet_likes,
        article_url,
        language,
        summary_english,
        summary_generated_at,
        indexed,
        score
      `)
      .eq('indexed', true) // Only show indexed articles
      .limit(limit)

    // Apply search filter
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,title_english.ilike.%${search.trim()}%`)
    }

    // Apply category filter (server-side)
    // NOTE: Category column doesn't exist in database, filtering is disabled
    // Skip filter - category filtering is not available
    // if (category && category.trim() && category.trim() !== 'All Category' && category.trim() !== 'All') {
    //   query = query.ilike('category', `%${category.trim()}%`)
    // }

    // Apply language filter
    if (language && language.trim() && language !== 'all') {
      query = query.eq('language', language.trim())
    }

    // Apply sorting - use article_published_at for article_main table
    if (sort === 'newest') {
      query = query.order('article_published_at', { ascending: false, nullsFirst: false })
    } else if (sort === 'oldest') {
      query = query.order('article_published_at', { ascending: true, nullsFirst: true })
    } else if (sort === 'views_high') {
      query = query.order('tweet_views', { ascending: false, nullsFirst: false })
    } else if (sort === 'views_low') {
      query = query.order('tweet_views', { ascending: true, nullsFirst: true })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching articles:', error)
      throw new Error(`Failed to fetch articles: ${error.message}`)
    }

    // Map database fields to Article interface
    return (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      tags: [],
      created_at: item.article_published_at || item.updated_at || new Date().toISOString(),
    })) as unknown as Article[]
    
  } catch (error) {
    console.error('Unexpected error fetching articles:', error)
    throw error
  }
}


/**
 * Server-side function to fetch trending articles from Supabase
 * This is essentially the same as fetchArticles but with a different name for the trending page
 */
export async function fetchTrendingArticles(options: FetchArticlesOptions = {}): Promise<Article[]> {
  // Use the same logic as fetchArticles
  return fetchArticles(options)
}

/**
 * Get available categories
 */
export async function getArticleCategories(): Promise<string[]> {
  // Return fixed list of standard categories
  const standardCategories = [
    'Hardware',
    'Gaming',
    'Health',
    'Environment',
    'Personal Story',
    'Culture',
    'Philosophy',
    'History',
    'Education',
    'Design',
    'Marketing',
    'AI',
    'Crypto',
    'Tech',
    'Data',
    'Startups',
    'Business',
    'Markets',
    'Product',
    'Security',
    'Policy',
    'Science',
    'Media'
  ]
  
  return standardCategories
}

/**
 * Get a single article by slug
 * Handles both formats:
 * - New: title-only (e.g., "networking-at-crypto-events")
 * - Old: title--shortId (e.g., "networking-at-crypto-events--a1b2c3")
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    // Use anon client for ISR caching (doesn't require cookies)
    const supabase = createAnonClient()

    // First try direct slug lookup (new format)
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle()

    // If not found and slug contains --, try old format with shortId
    if (!data) {
      const parts = slug.split('--')
      if (parts.length >= 2) {
        const shortId = parts[parts.length - 1]
        // Use RPC function for efficient short ID lookup
        const { data: dataByShortId, error: errorByShortId } = await supabase
          .rpc('find_articles_by_short_id', { p_short_id: shortId })

        if (!errorByShortId && dataByShortId && dataByShortId.length > 0) {
          return dataByShortId[0] as Article
        }
      }
    }

    if (error) {
      console.error('Error fetching article by slug:', error)
      return null
    }

    if (!data) {
      console.error('Article not found for slug:', slug)
      return null
    }

    return data as Article

  } catch (error) {
    console.error('Unexpected error fetching article by slug:', error)
    return null
  }
}

/**
 * Get article statistics
 */
export async function getArticleStats() {
  try {
    // Use anon client for ISR caching (doesn't require cookies)
    const supabase = createAnonClient()
    
    const { count, error } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error fetching article stats:', error)
      return { total: 0 }
    }

    return { total: count || 0 }
    
  } catch (error) {
    console.error('Unexpected error fetching stats:', error)
    return { total: 0 }
  }
}

/**
 * Get previous article (older than current)
 * Falls back to direct query if RPC function is not available
 */
export async function getPreviousArticle(currentArticleId: string): Promise<Article | null> {
  try {
    // Use anon client for ISR caching (doesn't require cookies)
    const supabase = createAnonClient()

    // First try to get the current article's published date
    const { data: currentArticle, error: currentError } = await supabase
      .from('articles')
      .select('id, article_published_at, updated_at')
      .eq('id', currentArticleId)
      .single()

    if (currentError || !currentArticle) {
      console.error('Error fetching current article:', currentError)
      return null
    }

    const currentDate = currentArticle.article_published_at || currentArticle.updated_at

    // Query for the previous article (older than current)
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        title_english,
        slug,
        image,
        author_name,
        author_handle,
        author_avatar,
        article_published_at,
        updated_at
      `)
      .lt('article_published_at', currentDate)
      .order('article_published_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching previous article:', error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    return {
      ...data[0],
      tags: [],
      created_at: data[0].article_published_at || data[0].updated_at || new Date().toISOString(),
    } as Article

  } catch (error) {
    console.error('Unexpected error fetching previous article:', error)
    return null
  }
}

/**
 * Get next article (newer than current)
 * Falls back to direct query if RPC function is not available
 */
export async function getNextArticle(currentArticleId: string): Promise<Article | null> {
  try {
    // Use anon client for ISR caching (doesn't require cookies)
    const supabase = createAnonClient()

    // First try to get the current article's published date
    const { data: currentArticle, error: currentError } = await supabase
      .from('articles')
      .select('id, article_published_at, updated_at')
      .eq('id', currentArticleId)
      .single()

    if (currentError || !currentArticle) {
      console.error('Error fetching current article:', currentError)
      return null
    }

    const currentDate = currentArticle.article_published_at || currentArticle.updated_at

    // Query for the next article (newer than current)
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        title_english,
        slug,
        image,
        author_name,
        author_handle,
        author_avatar,
        article_published_at,
        updated_at
      `)
      .gt('article_published_at', currentDate)
      .order('article_published_at', { ascending: true })
      .limit(1)

    if (error) {
      console.error('Error fetching next article:', error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    return {
      ...data[0],
      tags: [],
      created_at: data[0].article_published_at || data[0].updated_at || new Date().toISOString(),
    } as Article

  } catch (error) {
    console.error('Unexpected error fetching next article:', error)
    return null
  }
}

/**
 * Get related articles (recent articles, excluding current)
 */
export async function getRelatedArticles(articleId: string, limit: number = 4): Promise<Article[]> {
  try {
    // Use anon client for ISR caching (doesn't require cookies)
    const supabase = createAnonClient()

    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        title_english,
        slug,
        image,
        author_name,
        author_handle,
        author_avatar,
        article_published_at,
        updated_at,
        tweet_views
      `)
      .neq('id', articleId)
      .order('article_published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching related articles:', error)
      return []
    }

    return (data || []).map((item) => ({
      ...item,
      tags: [],
      created_at: item.article_published_at || item.updated_at || new Date().toISOString(),
    })) as unknown as Article[]

  } catch (error) {
    console.error('Unexpected error fetching related articles:', error)
    return []
  }
}
import { createClient } from '@/lib/supabase/server'
import { Article } from '@/components/article-card'

export type SortOption = 'newest' | 'oldest' | 'views_high' | 'views_low'

export interface FetchArticlesOptions {
  limit?: number
  sort?: SortOption
  search?: string
  category?: string
  language?: string
  tag?: string
  tags?: string[]
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
    tag,
    tags,
  } = options

  try {
    const supabase = await createClient()

    // Only select columns needed for article cards to reduce payload size
    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        title_english,
        slug,
        image,
        category,
        author_name,
        author_handle,
        author_avatar,
        article_published_at,
        updated_at,
        tag,
        tweet_views,
        tweet_replies,
        tweet_likes,
        article_url,
        language,
        summary_english,
        summary_generated_at
      `)
      .limit(limit)

    // Apply search filter
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,title_english.ilike.%${search.trim()}%`)
    }

    // Apply category filter (server-side)
    // Skip filter if category is "All Category" or "All" to show all articles
    if (category && category.trim() && category.trim() !== 'All Category' && category.trim() !== 'All') {
      // Use ilike to match category within comma-separated values
      query = query.ilike('category', `%${category.trim()}%`)
    }

    // Apply language filter
    if (language && language.trim() && language !== 'all') {
      query = query.eq('language', language.trim())
    }

    // Apply tag filter (tag is a comma-separated string)
    if (tags && tags.length > 0) {
      // Filter by multiple tags using OR condition with ilike for comma-separated values
      const tagConditions = tags.map(t => `tag.ilike.%${t.trim()}%`).join(',')
      query = query.or(tagConditions)
    } else if (tag && tag.trim()) {
      query = query.ilike('tag', `%${tag.trim()}%`)
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
      tags: item.tag ? (item.tag as string).split(',').map((t: string) => t.trim()) : [],
      created_at: item.article_published_at || item.updated_at || new Date().toISOString(),
    })) as Article[]
    
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
 * Uses RPC function for O(1) lookup instead of table scanning
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const supabase = await createClient()

    // Extract article ID from slug (last part after --)
    const parts = slug.split('--');
    if (parts.length < 2) {
      console.error('Invalid slug format:', slug)
      return null;
    }

    const shortId = parts[parts.length - 1];

    // Use RPC function for efficient lookup (O(1) with index)
    const { data, error } = await supabase
      .rpc('find_articles_by_short_id', { p_short_id: shortId })

    if (error) {
      console.error('Error fetching article by short_id:', error)
      return null
    }

    if (!data || data.length === 0) {
      console.error('Article not found for shortId:', shortId)
      return null
    }

    // Return the first matching article
    return data[0] as Article

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
    const supabase = await createClient()
    
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
    const supabase = await createClient()

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
        category,
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
    const supabase = await createClient()

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
        category,
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
 * Get related articles (same category, recent)
 */
export async function getRelatedArticles(articleId: string, category: string | null, limit: number = 4): Promise<Article[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        title_english,
        slug,
        image,
        category,
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

    // Filter by category if available
    if (category && category.trim()) {
      query = query.ilike('category', `%${category.trim()}%`)
    }

    const { data, error } = await query

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
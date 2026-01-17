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
        article_preview_text,
        article_preview_text_english,
        image,
        article_image,
        category,
        author_name,
        author_handle,
        author_avatar,
        author_profile_image,
        article_published_at,
        created_at,
        updated_at,
        tags,
        tweet_views,
        tweet_replies,
        tweet_retweets,
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

    // Apply tag filter (if these fields exist in article_main)
    if (tags && tags.length > 0) {
      // Filter by multiple tags using OR condition
      const tagConditions = tags.map(t => `tag.eq.${t.trim()}`).join(',')
      query = query.or(tagConditions)
    } else if (tag && tag.trim()) {
      query = query.eq('tag', tag.trim())
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

    return data || []
    
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
      .rpc('find_articles_by_short_id', { short_id: shortId })

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
 * Get previous article
 */
export async function getPreviousArticle(currentArticleId: string): Promise<Article | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .rpc('get_previous_article', { current_article_id: currentArticleId })

    if (error) {
      console.error('Error fetching previous article:', error)
      return null
    }

    return data?.[0] || null
    
  } catch (error) {
    console.error('Unexpected error fetching previous article:', error)
    return null
  }
}

/**
 * Get next article
 */
export async function getNextArticle(currentArticleId: string): Promise<Article | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .rpc('get_next_article', { current_article_id: currentArticleId })

    if (error) {
      console.error('Error fetching next article:', error)
      return null
    }

    return data?.[0] || null
    
  } catch (error) {
    console.error('Unexpected error fetching next article:', error)
    return null
  }
}
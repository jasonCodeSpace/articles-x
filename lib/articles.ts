import { createClient } from '@/lib/supabase/server'
import { Article } from '@/components/article-card'

export type SortOption = 'newest' | 'oldest'

export interface FetchArticlesOptions {
  limit?: number
  sort?: SortOption
  search?: string
  category?: string
}

/**
 * Server-side function to fetch articles from Supabase
 */
export async function fetchArticles(options: FetchArticlesOptions = {}): Promise<Article[]> {
  const {
    limit = 100,
    sort = 'newest',
    search,
    // category param is ignored server-side to avoid errors when column doesn't exist
  } = options

  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        author_name,
        author_handle,
        author_profile_image,
        featured_image_url,
        published_at,
        created_at,
        tags,
        article_url
      `)
      .eq('status', 'published') // Only fetch published articles
      .limit(limit)

    // Apply search filter
    if (search && search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`)
    }

    // Do NOT apply category filter here to maintain compatibility with DBs missing the category column.
    // Category filtering is handled client-side in useArticleFeed.

    // Apply sorting
    if (sort === 'newest') {
      query = query.order('published_at', { ascending: false, nullsFirst: false })
                   .order('created_at', { ascending: false })
    } else {
      query = query.order('published_at', { ascending: true, nullsFirst: true })
                   .order('created_at', { ascending: true })
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
 * Get available categories
 */
export async function getArticleCategories(): Promise<string[]> {
  type CategoryRow = { category: string | null }

  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('articles')
      .select('category')
      .eq('status', 'published')
      .not('category', 'is', null)

    if (error) {
      // Gracefully handle missing column in some environments without using any
      const errorWithCode = error as { code?: unknown }
      if (typeof errorWithCode.code === 'string' && errorWithCode.code === '42703') {
        return []
      }
      console.error('Error fetching categories:', error)
      return []
    }

    const rows: CategoryRow[] = (data ?? []) as CategoryRow[]

    // Extract unique categories
    const categories = [...new Set(rows.map((item) => item.category).filter((c): c is string => Boolean(c)))]
    return categories.sort()
    
  } catch (error) {
    console.error('Unexpected error fetching categories:', error)
    return []
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
      .eq('status', 'published')

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
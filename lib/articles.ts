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
    category,
  } = options

  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('articles')
      .select('*')
      .limit(limit)

    // Apply search filter
    if (search && search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`)
    }

    // Apply category filter (server-side) - safe because we ensured this column exists via migration
    if (category && category.trim()) {
      query = query.eq('category', category.trim())
    }

    // Apply sorting (avoid referencing columns that may not exist like created_at)
    if (sort === 'newest') {
      query = query.order('published_at', { ascending: false, nullsFirst: false })
    } else {
      query = query.order('published_at', { ascending: true, nullsFirst: true })
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
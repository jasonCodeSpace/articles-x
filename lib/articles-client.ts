import { createClient } from '@/lib/supabase/client'
import { Article } from '@/components/article-card'

export type SortOption = 'newest' | 'oldest' | 'views_high' | 'views_low'

export interface FetchArticlesOptions {
  limit?: number
  sort?: SortOption
  search?: string
  category?: string
}

/**
 * Client-side function to fetch articles from Supabase
 */
export async function fetchArticlesClient(options: FetchArticlesOptions = {}): Promise<Article[]> {
  const {
    limit = 10000,
    sort = 'newest',
    search,
    category,
  } = options

  try {
    const supabase = createClient()
    
    let query = supabase
      .from('articles')
      .select(`
        *,
        summary_chinese,
        summary_english,
        summary_generated_at
      `)
      .limit(limit)

    // Apply search filter
    if (search && search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`)
    }

    // Apply category filter
    if (category && category.trim() && category !== 'All') {
      query = query.eq('category', category.trim())
    }

    // Apply sorting
    if (sort === 'newest') {
      query = query.order('article_published_at', { ascending: false, nullsFirst: false })
    } else if (sort === 'oldest') {
      query = query.order('article_published_at', { ascending: true, nullsFirst: false })
    } else if (sort === 'views_high') {
      query = query.order('tweet_views', { ascending: false, nullsFirst: false })
    } else if (sort === 'views_low') {
      query = query.order('tweet_views', { ascending: true, nullsFirst: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching articles:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    throw error
  }
}

/**
 * Client-side function to get article categories
 */
export async function getArticleCategoriesClient(): Promise<string[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null)

    if (error) {
      console.error('Error fetching categories:', error)
      throw error
    }

    // Extract unique categories
    const categories = [...new Set(data?.map(item => item.category).filter(Boolean) || [])]
    return categories.sort()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}
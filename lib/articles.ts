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
    category
  } = options

  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        content,
        excerpt,
        author_name,
        author_handle,
        author_profile_image,
        featured_image_url,
        published_at,
        created_at,
        tags,
        category,
        article_url
      `)
      .eq('status', 'published') // Only fetch published articles
      .limit(limit)

    // Apply search filter
    if (search && search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`)
    }

    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

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
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('articles')
      .select('category')
      .eq('status', 'published')
      .not('category', 'is', null)

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    // Extract unique categories
    const categories = [...new Set(data?.map(item => item.category).filter(Boolean))]
    return categories.sort()
    
  } catch (error) {
    console.error('Unexpected error fetching categories:', error)
    return []
  }
}
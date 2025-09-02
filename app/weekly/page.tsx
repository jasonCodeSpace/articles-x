import { Suspense } from 'react'
import { getArticleCategories } from '@/lib/articles'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { createClient } from '@/lib/supabase/server'
import { Article } from '@/components/article-card'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Weekly Articles | Articles X',
  description: 'Discover weekly articles and insights',
}

// Enable dynamic rendering to avoid build-time database queries
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>
}

// Custom fetch function for Weekly articles (Day and Week tags)
async function fetchWeeklyArticles(options: {
  search?: string
  category?: string
  limit?: number
  sort?: 'newest' | 'oldest'
  language?: string
}): Promise<Article[]> {
  const supabase = await createClient()
  
  // Weekly page should include both Week and Day tagged articles
  const tagsToFilter = ['Week', 'Day']
  
  let query = supabase
    .from('articles')
    .select(`
      *,
      summary_chinese,
      summary_english,
      summary_generated_at
    `)
    .in('tag', tagsToFilter)
    .order('article_published_at', { ascending: false })
    .limit(10000)
  
  if (options.search && options.search.trim()) {
    query = query.or(`title.ilike.%${options.search.trim()}%,author_name.ilike.%${options.search.trim()}%,author_handle.ilike.%${options.search.trim()}%`)
  }
  
  if (options.category && options.category !== 'all' && options.category.trim()) {
    query = query.eq('category', options.category.trim())
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching weekly articles:', error)
    return []
  }
  
  return data || []
}

export default async function WeeklyPage({ searchParams }: PageProps) {
  const { category, search } = await searchParams
  
  // Fetch Weekly articles (Day and Week tags) and categories
  const [articles, categories] = await Promise.all([
    fetchWeeklyArticles({ category, search }),
    getArticleCategories()
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-24 pb-6">
      <div className="space-y-6">
        <Suspense fallback={<FeedLoading />}>
          <ArticleFeed 
            initialArticles={articles} 
            initialCategories={categories}
            initialCategory={category || 'all'}
            initialSearchQuery={search || ''}
          />
        </Suspense>
      </div>
    </div>
  )
}
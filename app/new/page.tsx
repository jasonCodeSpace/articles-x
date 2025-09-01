import { Suspense } from 'react'
import { getArticleCategories } from '@/lib/articles'
import { ArticleFeed } from '@/components/article-feed'
import { FeedLoading } from '@/components/feed-loading'
import { createClient } from '@/lib/supabase/server'
import { Article } from '@/components/article-card'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Articles | Articles X',
  description: 'Discover the latest articles and insights',
}

// Enable dynamic rendering for search params
export const dynamic = 'force-dynamic'

// Generate static params for both daily and weekly views
export async function generateStaticParams() {
  return [
    {}, // Default (daily)
    { filter: 'week' }, // Weekly
  ]
}

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; page?: string; filter?: string }>
}

// Custom fetch function for New articles (Day or Week tags)
async function fetchNewArticles(options: {
  search?: string
  category?: string
  limit?: number
  sort?: 'newest' | 'oldest'
  language?: string
  filter?: string
}): Promise<Article[]> {
  const supabase = await createClient()
  
  // Determine which tags to filter by based on filter parameter
  let tagsToFilter: string[]
  if (options.filter === 'week') {
    // Weekly Article page should include both Week and Day tagged articles
    tagsToFilter = ['Week', 'Day']
  } else {
    tagsToFilter = ['Day']
  }
  
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
    console.error('Error fetching new articles:', error)
    return []
  }
  
  return data || []
}

export default async function NewPage({ searchParams }: PageProps) {
  const { category, search, filter } = await searchParams
  
  // Fetch New articles (Day or Week tags) and categories
  const [articles, categories] = await Promise.all([
    fetchNewArticles({ category, search, filter }),
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
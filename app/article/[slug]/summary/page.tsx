import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Skeleton } from '@/components/ui/skeleton'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { SummaryContentClient } from '@/components/summary-content-client'
import { notFound } from 'next/navigation'

interface SummarySection {
  watchlist?: string[]
  key_data_points?: string[]
  other_quick_reads?: string[]
  policy_media_security?: string[]
}

interface SummaryJson {
  date: string
  lang: string
  meta: {
    notes: string
    domains_covered: string[]
  }
  counts: {
    articles_total: number
  }
  sections: SummarySection
}

interface DailySummary {
  id: string
  date: string
  summary_content: string
  summary_json_en: SummaryJson | null
  summary_json_zh: SummaryJson | null
  top_article_title: string
  top_article_id: string | null
  total_articles_count: number
  categories_summary: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

interface Article {
  id: string
  title: string
  image?: string
  summary_chinese?: string
  article_preview_text?: string
  created_at: string
  updated_at: string
  slug?: string
}

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching article:', error)
    return null
  }

  return data
}

function SummaryLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function ArticleSummaryPage({ params }: PageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  // Create summary data based on article
  const summaryData: DailySummary = {
    id: article.id,
    date: new Date(article.created_at).toISOString().split('T')[0],
    summary_content: JSON.stringify({
      title: article.title,
      summary_chinese: article.summary_chinese || article.article_preview_text || 'No summary available',
      article_preview_text: article.article_preview_text || 'No preview available'
    }),
    summary_json_en: null,
    summary_json_zh: null,
    top_article_title: article.title,
    top_article_id: article.id,
    total_articles_count: 1,
    categories_summary: null,
    created_at: article.created_at,
    updated_at: article.updated_at
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNavWrapper categories={[]} />
      
      <div className="pt-20 md:pt-16 pb-20 md:pb-0">
        <Suspense fallback={<SummaryLoading />}>
          <SummaryContentClient 
            summary={summaryData}
          />
        </Suspense>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Article Summary | Xarticle',
  description: 'View article summary and insights.',
}
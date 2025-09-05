import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { SummaryContentClient } from '@/components/summary-content-client'

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

async function getDailySummary(): Promise<DailySummary | null> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  const { data, error } = await supabase
    .from('daily_summary')
    .select('*')
    .eq('date', today)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

// SummaryContent component moved to separate client component

function SummaryLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default async function SummaryPage() {
  const supabase = await createClient()
  
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch categories for navigation
  let categories: string[] = [];
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null);

    if (!error && data) {
      const uniqueCategories = new Set<string>();
      data.forEach(article => {
        if (article.category) {
          const firstCategory = article.category.split(',')[0].trim();
          uniqueCategories.add(firstCategory);
        }
      });
      categories = Array.from(uniqueCategories).sort();
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }

  const summary = await getDailySummary()
  
  if (!summary) {
    return (
      <div className="min-h-screen bg-background">
        <ClientNavWrapper initialUser={user} categories={categories} />
        <div className="container mx-auto px-4 py-8 max-w-4xl pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Summary Available</h1>
            <p className="text-muted-foreground">
              Today&apos;s summary hasn&apos;t been generated yet. Please check back later.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background">
      <ClientNavWrapper initialUser={user} categories={categories} />
      <div className="pt-24">
        <Suspense fallback={<SummaryLoading />}>
          <SummaryContentClient summary={summary} />
        </Suspense>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Daily Summary - Curated Articles and Insights | Xarticle',
  description: 'Discover today\'s most important articles and insights from X (Twitter). Get comprehensive daily summaries with key topics, trending discussions, and curated content from top voices.',
  alternates: {
    canonical: '/summary'
  },
  openGraph: {
    title: 'Daily Summary - Curated Articles and Insights | Xarticle',
    description: 'Discover today\'s most important articles and insights from X (Twitter). Get comprehensive daily summaries with key topics, trending discussions, and curated content from top voices.',
    type: 'website'
  }
}
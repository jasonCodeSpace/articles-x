import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SummaryContentClient } from '@/components/summary-content-client'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ date: string }>
}

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

async function getSummary(date: string): Promise<DailySummary | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('daily_summary')
    .select('*')
    .eq('date', date)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return {
    title: `Daily Report - ${formattedDate} | Xarticle`,
    description: `AI-generated summary of the best articles from X on ${formattedDate}. Curated insights and trends.`,
    openGraph: {
      title: `Daily Report - ${formattedDate} | Xarticle`,
      description: `AI-generated summary of the best articles from X on ${formattedDate}.`,
      url: `https://www.xarticle.news/summary/${date}`,
      siteName: 'Xarticle',
      type: 'article',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Daily Report - ${formattedDate} | Xarticle`,
      description: `AI-generated summary of the best articles from X on ${formattedDate}.`,
      images: ['/og-image.png'],
    },
  }
}

export default async function ReportPage({ params }: PageProps) {
  const { date } = await params

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound()
  }

  const supabase = await createClient()
  const [summary, userResult] = await Promise.all([
    getSummary(date),
    supabase.auth.getUser()
  ])

  if (!summary) {
    notFound()
  }

  const user = userResult.data?.user

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <ClientNavWrapper initialUser={user} categories={[]} />

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] left-[10%] w-[30%] h-[30%] bg-white/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] bg-white/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 pt-24">
        <div className="max-w-4xl mx-auto px-6 mb-6">
          <Link
            href="/summary"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            All Reports
          </Link>
        </div>
        <SummaryContentClient summary={summary} />
      </div>
    </div>
  )
}

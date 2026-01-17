import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, ChevronRight, Archive } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Historical Summaries Archive | Xarticle',
  description: 'Browse our complete archive of daily summaries featuring curated articles and insights from X. Explore past trends and important discussions.',
  alternates: { canonical: '/summaries' },
  openGraph: {
    title: 'Historical Summaries Archive | Xarticle',
    description: 'Browse our complete archive of daily summaries featuring curated articles and insights from X.',
    type: 'website',
    url: 'https://www.xarticle.news/summaries',
    siteName: 'Xarticle',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Historical Summaries Archive | Xarticle' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@xarticle_news',
    title: 'Historical Summaries Archive | Xarticle',
    description: 'Browse our complete archive of daily summaries featuring curated articles and insights from X.',
    images: ['/og-image.png'],
  },
}

export const revalidate = 300

interface SummaryData {
  overview?: string
  key_topics?: string[]
  [key: string]: unknown
}

interface DailySummary {
  id: string
  date: string
  total_articles_count: number
  summary_content: string | null
  summary_json_en: SummaryData | null
  summary_json_zh: SummaryData | null
  created_at: string
}

async function getSummaries(): Promise<DailySummary[]> {
  const supabase = await createClient()

  const { data: summaries, error } = await supabase
    .from('daily_summary')
    .select('*')
    .order('date', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching summaries:', error)
    return []
  }

  return summaries || []
}

function formatDate(dateStr: string): { weekday: string; day: string; monthYear: string } {
  const date = new Date(dateStr + 'T00:00:00')
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    day: date.getDate().toString(),
    monthYear: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  }
}

function getPreview(summary: DailySummary): string {
  const summaryData = summary.summary_json_en || summary.summary_json_zh

  if (summaryData?.overview) {
    return summaryData.overview.substring(0, 150) + '...'
  }

  if (summary.summary_content) {
    const lines = summary.summary_content.split('\n').filter(line =>
      line.trim() && !line.startsWith('#') && !line.startsWith('{')
    )
    const preview = lines.slice(0, 2).join(' ').substring(0, 150)
    return preview ? preview + '...' : 'Daily summary of curated articles from X.'
  }

  return `Daily summary featuring ${summary.total_articles_count} curated articles and insights from X.`
}

function getTopics(summary: DailySummary): string[] {
  const summaryData = summary.summary_json_en || summary.summary_json_zh
  return summaryData?.key_topics?.slice(0, 3) || []
}

function SummariesList({ summaries }: { summaries: DailySummary[] }) {
  if (summaries.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <FileText className="w-10 h-10 text-white/30" />
        </div>
        <h3 className="text-xl font-medium text-white/60 mb-2">No Summaries Yet</h3>
        <p className="text-white/30">Historical summaries will appear here once generated.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {summaries.map((summary) => {
        const { weekday, day, monthYear } = formatDate(summary.date)
        const topics = getTopics(summary)

        return (
          <Link
            key={summary.id}
            href={`/summary?date=${summary.date}`}
            className="group flex items-stretch gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
          >
            {/* Date block */}
            <div className="flex-shrink-0 w-20 flex flex-col items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 py-3">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">{weekday}</span>
              <span className="text-3xl font-bold text-white/90">{day}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/30">{monthYear}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[11px] text-white/30">
                  {summary.total_articles_count} articles summarized
                </span>
              </div>

              <h3 className="text-lg font-medium text-white/90 group-hover:text-white transition-colors mb-2 truncate">
                Summary — {new Date(summary.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>

              <p className="text-sm text-white/40 line-clamp-2 leading-relaxed mb-3">
                {getPreview(summary)}
              </p>

              {/* Topics tags */}
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-white/40 uppercase tracking-wider"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 flex items-center">
              <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-stretch gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse">
          <div className="w-20 h-24 rounded-xl bg-white/5" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-white/5 rounded w-1/4" />
            <div className="h-5 bg-white/5 rounded w-2/3" />
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="flex gap-2">
              <div className="h-5 bg-white/5 rounded w-16" />
              <div className="h-5 bg-white/5 rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function SummariesPage() {
  const summaries = await getSummaries()

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/20">
      {/* Decorative background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] left-[10%] w-[30%] h-[30%] bg-white/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] bg-white/[0.02] rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-4xl px-6 pt-32 pb-20">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
              <Archive className="w-6 h-6 text-white/60" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Historical Summaries
              </h1>
              <p className="text-white/40 text-sm">Browse the archive of past daily summaries</p>
            </div>
          </div>

          {/* Link to new daily reports */}
          <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-sm text-white/40 mb-2">Looking for the latest AI-generated reports?</p>
            <Link href="/summary" className="text-white/80 hover:text-white transition-colors text-sm font-medium inline-flex items-center gap-1">
              View Daily Reports
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </header>

        <Suspense fallback={<LoadingSkeleton />}>
          <SummariesList summaries={summaries} />
        </Suspense>
      </main>
    </div>
  )
}

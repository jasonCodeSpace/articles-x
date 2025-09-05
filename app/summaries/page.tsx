import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export const metadata = {
  title: 'Historical Daily Summaries Archive | Xarticle',
  description: 'Browse our complete archive of daily summaries featuring curated articles and insights from X (Twitter). Explore past trends, key topics, and important discussions from the social media landscape.',
  alternates: {
    canonical: '/summaries'
  },
  openGraph: {
    title: 'Historical Daily Summaries Archive | Xarticle',
    description: 'Browse our complete archive of daily summaries featuring curated articles and insights from X (Twitter). Explore past trends, key topics, and important discussions from the social media landscape.',
    type: 'website',
    url: 'https://www.xarticle.news/summaries',
    siteName: 'Xarticle',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Historical Daily Summaries Archive | Xarticle',
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@xarticle_news',
    creator: '@xarticle_news',
    title: 'Historical Daily Summaries Archive | Xarticle',
    description: 'Browse our complete archive of daily summaries featuring curated articles and insights from X (Twitter). Explore past trends, key topics, and important discussions from the social media landscape.',
    images: {
      url: '/og-image.svg',
      alt: 'Historical Daily Summaries Archive | Xarticle',
    },
  },
}

interface SummaryData {
  title: string
  content: string
  lang?: string
  overview?: string
  key_topics?: string[]
  [key: string]: unknown
}

interface DailySummary {
  id: string
  date: string
  total_articles_count: number
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
    .limit(50)
  
  if (error) {
    console.error('Error fetching summaries:', error)
    return []
  }
  
  return summaries || []
}

function SummaryCard({ summary }: { summary: DailySummary }) {
  const summaryData = summary.summary_json_en || summary.summary_json_zh
  const timeAgo = formatDistanceToNow(new Date(summary.created_at), {
    addSuffix: true
  })
  
  const dateTitle = new Date(summary.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) + ' Summary'
  
  return (
    <Link href={`/summary?date=${summary.date}`} className="block">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:bg-card/90 hover:border-border/80 transition-all duration-300 group cursor-pointer shadow-xl hover:shadow-2xl hover:scale-[1.02] flex flex-col h-[480px]">
        {/* Featured image at the top */}
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src="/image.webp"
            alt={`Cover for ${dateTitle}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
            loading="eager"
            unoptimized
            referrerPolicy="no-referrer"
          />
        </div>
        
        {/* Card content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Article title */}
          <h3 className="text-foreground text-lg font-semibold leading-tight line-clamp-2 group-hover:text-accent-foreground transition-colors duration-200 mb-3">
            {dateTitle}
          </h3>
          
          {/* Article preview text */}
          <div className="flex-grow">
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
              {summaryData?.overview || `Daily summary featuring ${summary.total_articles_count} curated articles and insights from X.`}
            </p>
            
            {/* Key topics */}
            {summaryData?.key_topics && summaryData.key_topics.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {summaryData.key_topics.slice(0, 3).map((topic: string, index: number) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
                  >
                    {topic}
                  </span>
                ))}
                {summaryData.key_topics.length > 3 && (
                  <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                    +{summaryData.key_topics.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Author info and article count */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 ring-1 ring-border">
                 <AvatarImage 
                   src="/logo.svg" 
                   alt="xarticle profile picture"
                   loading="lazy"
                   referrerPolicy="no-referrer"
                 />
                 <AvatarFallback className="text-xs font-medium bg-muted text-foreground">
                   XA
                 </AvatarFallback>
               </Avatar>
              <span className="font-medium text-muted-foreground truncate hover:text-foreground transition-colors">
                @xarticle
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                <span>·</span>
                <time>
                  {timeAgo}
                </time>
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              {summary.total_articles_count} articles
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function SummariesContent({ summaries }: { summaries: DailySummary[] }) {
  if (summaries.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No Historical Summaries</h3>
        <p className="text-muted-foreground">No daily summaries have been generated yet</p>
      </div>
    )
  }
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {summaries.map((summary) => (
        <SummaryCard key={summary.id} summary={summary} />
      ))}
    </div>
  )
}

export default async function SummariesPage() {
  const summaries = await getSummaries()
  
  return (
    <div className="min-h-screen bg-background">
      <ClientNavWrapper categories={[]} />
      
      <main className="container mx-auto px-4 py-8 pt-32">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Historical Summaries</h1>
            <p className="text-lg text-muted-foreground">
              Browse all historical daily summaries from Xarticle
            </p>
            <h2 className="sr-only">Daily Summary Archive</h2>
          </div>
          
          <Suspense fallback={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }>
            <SummariesContent summaries={summaries} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
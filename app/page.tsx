import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Star } from 'lucide-react'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { createAnonClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { categoryIdToSlug } from '@/lib/url-utils'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Xarticle — The Best Articles from X, Curated & Scored',
  description: 'Discover the most valuable long-form articles shared on X. AI-powered summaries, quality scoring, and curated content.',
  alternates: { canonical: 'https://www.xarticle.news/' },
  openGraph: {
    title: 'Xarticle — The Best Articles from X, Curated & Scored',
    description: 'Discover the most valuable long-form articles shared on X.',
    url: 'https://www.xarticle.news/',
    siteName: 'Xarticle',
    type: 'website',
    images: [{ url: '/og-image.webp', width: 1200, height: 630, alt: 'Xarticle', type: 'image/webp' }]
  }
}

export const revalidate = 300

interface TopArticle {
  id: string
  title: string
  title_english: string | null
  slug: string
  image: string
  author_name: string
  author_handle: string
  author_avatar: string
  article_published_at: string
  tweet_views: number
  score: number
  summary_english: string | null
  summary_chinese: string | null
  category: string
  sub_category: string
}

async function getTopArticles(): Promise<TopArticle[]> {
  const supabase = createAnonClient()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data } = await supabase
    .from('articles')
    .select('id, title, title_english, slug, image, author_name, author_handle, author_avatar, article_published_at, tweet_views, score, summary_english, summary_chinese, category, sub_category')
    .eq('indexed', true)
    .gte('score', 60)
    .gte('article_published_at', sevenDaysAgo.toISOString())
    .order('score', { ascending: false })
    .limit(3)

  return (data as TopArticle[]) || []
}

function formatViews(views: number) {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M'
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K'
  return views.toString()
}

function TopArticleCard({ article }: { article: TopArticle }) {
  const scoreColor = article.score >= 90 ? 'text-yellow-400' : article.score >= 75 ? 'text-green-400' : 'text-blue-400'
  const summaryText = article.summary_english || article.summary_chinese || 'A high-quality article from a trusted source on X.'
  const shortSummary = summaryText.slice(0, 120) + '...'
  const categorySlug = categoryIdToSlug(article.category || 'tech:ai')
  const articleUrl = `/article/${categorySlug}/${article.slug}`

  return (
    <Link href={articleUrl} className="block group">
      <article className="h-full rounded-xl bg-card border border-border hover:border-white/10 transition-colors overflow-hidden">
        <div className="relative h-40 overflow-hidden bg-white/5">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/50 text-[10px] font-bold">
            <Star size={8} className={scoreColor} />
            <span className={scoreColor}>{article.score}</span>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40">{article.sub_category}</span>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {article.title_english || article.title}
          </h3>
          <p className="text-xs text-white/40 line-clamp-2">{shortSummary}</p>
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-xs text-white/60">@{article.author_handle}</span>
            <span className="text-[10px] text-white/30">{formatViews(article.tweet_views)} views</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default async function HomePage() {
  const supabase = createAnonClient()

  const categories = ['AI', 'Crypto', 'Tech', 'Business', 'Startups', 'Gaming', 'Health', 'Science']

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
        <ClientNavWrapper categories={categories} />

        {/* Hero */}
        <section className="pt-24 pb-12 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium tracking-wider text-white/50">
              <Star size={10} className="text-yellow-400" />
              <span>Quality-Scored Content</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              The best of X,<br /><span className="text-white/40">curated & scored.</span>
            </h1>
            <p className="text-base text-white/50 max-w-xl mx-auto">
              We discover, score, and summarize the most valuable long-form articles shared on X.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="bg-white text-black hover:bg-white/90 px-6 py-5 rounded-full text-sm">
                <Link href="/trending">Explore Trending<ArrowRight className="ml-2" size={14} /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Top Articles */}
        <Suspense fallback={<div className="py-12 text-center text-white/30 text-sm">Loading...</div>}>
          <TopArticlesSection />
        </Suspense>

        {/* Categories */}
        <section className="py-12 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-bold">Explore <span className="text-white/40">topics.</span></h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/trending?category=${cat.toLowerCase()}`}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-sm text-white/60"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <span className="text-xs text-white/40">© 2026 Xarticle</span>
            <div className="flex gap-4 text-[10px] text-white/30">
              <Link href="/trending" className="hover:text-white">Trending</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

async function TopArticlesSection() {
  const topArticles = await getTopArticles()

  if (topArticles.length === 0) return null

  return (
    <section className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Top <span className="text-white/40">This Week.</span></h2>
          <Link href="/trending" className="text-sm text-white/40 hover:text-white">View All →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topArticles.map((article) => (
            <TopArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  )
}

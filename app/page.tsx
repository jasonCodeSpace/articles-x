import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Star, Shield, Zap, Users, BookOpen, LucideIcon } from 'lucide-react'
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
    .gte('score', 65)
    .gte('article_published_at', sevenDaysAgo.toISOString())
    .order('tweet_views', { ascending: false })
    .limit(6)

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
  const shortSummary = summaryText.slice(0, 120) + (summaryText.length > 120 ? '...' : '')
  const categorySlug = categoryIdToSlug(article.category || 'tech:ai')
  const articleUrl = `/article/${categorySlug}/${article.slug}`

  return (
    <Link href={articleUrl} className="block group">
      <article className="h-full rounded-xl bg-card border border-border hover:border-white/10 transition-colors overflow-hidden">
        <div className="relative h-44 overflow-hidden bg-white/5">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 text-xs font-bold">
            <Star size={10} className={scoreColor} />
            <span className={scoreColor}>{article.score}</span>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <span className="text-[10px] uppercase tracking-wider text-white/40">{article.sub_category}</span>
          <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-white/80">
            {article.title_english || article.title}
          </h3>
          <p className="text-sm text-white/40 line-clamp-2">{shortSummary}</p>
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className="text-xs text-white/60">@{article.author_handle}</span>
            <span className="text-xs text-white/30">{formatViews(article.tweet_views)} views</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
        <Icon size={20} className="text-white/60" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-white/50">{description}</p>
    </div>
  )
}

export default async function HomePage() {
  const categories = [
    { id: 'tech:ai', name: 'AI' },
    { id: 'business:startups', name: 'Startups' },
    { id: 'tech:crypto', name: 'Crypto' },
    { id: 'product:product', name: 'Product' },
    { id: 'science:health', name: 'Health' },
    { id: 'science:science', name: 'Science' },
    { id: 'culture:philosophy', name: 'Philosophy' },
    { id: 'product:gaming', name: 'Gaming' },
  ]

  const stats = [
    { value: '60+', label: 'Min Score' },
    { value: '350+', label: 'Articles' },
    { value: '24/7', label: 'Monitoring' },
    { value: 'AI', label: 'Summarized' },
  ]

  const features = [
    { icon: Shield, title: 'Quality Scored', description: 'Every article is rated 0-100 based on content depth and credibility.' },
    { icon: Zap, title: 'AI Summaries', description: 'Get the key insights instantly with our AI-powered summaries.' },
    { icon: Users, title: 'Expert Curated', description: 'Content from founders, VCs, and industry leaders on X.' },
    { icon: BookOpen, title: 'No Noise', description: 'Only the best content makes it to your feed.' },
  ]

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
        <ClientNavWrapper categories={categories.map(c => c.name)} />

        {/* Subtle background */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />
        </div>

        {/* Hero Section */}
        <section className="relative pt-28 pb-16 px-6">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium tracking-wider text-white/50">
              <Star size={12} className="text-yellow-400" />
              <span>Quality-Scored Content</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
              The best of X,<br />
              <span className="text-white/40">curated & scored.</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
              We discover, score, and summarize the most valuable long-form articles shared on X.
              No noise, just quality content with AI-powered insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-white text-black hover:bg-white/90 px-8 py-6 rounded-full">
                <Link href="/trending">
                  Explore Trending
                  <ArrowRight className="ml-2" size={16} />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-white/10 hover:bg-white/5 px-8 py-6 rounded-full">
                <Link href="#top-articles">View Top Articles</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/30">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6 border-y border-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 text-center">
              Why <span className="text-white/40">Xarticle?</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Top Articles */}
        <Suspense fallback={<div className="py-20 text-center text-white/30">Loading...</div>}>
          <TopArticlesSection />
        </Suspense>

        {/* Categories */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Explore <span className="text-white/40">topics.</span>
            </h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/trending?category=${cat.id}`}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors text-sm text-white/60"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Start reading<br /><span className="text-white/40">what matters.</span>
            </h2>
            <p className="text-lg text-white/50">
              Escape the algorithmic feed. Discover curated, scored, and summarized articles from the brightest minds on X.
            </p>
            <Button size="lg" asChild className="bg-white text-black hover:bg-white/90 px-12 py-6 rounded-full">
              <Link href="/trending">
                Explore Trending
                <ArrowRight className="ml-2" size={16} />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <span className="text-sm text-white/40">© 2026 Xarticle</span>
            <div className="flex gap-6 text-xs text-white/30">
              <Link href="/trending" className="hover:text-white transition-colors">Trending</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
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
    <section id="top-articles" className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Top <span className="text-white/40">This Week.</span>
          </h2>
          <Link href="/trending" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1">
            View All
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topArticles.map((article) => (
            <TopArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  )
}

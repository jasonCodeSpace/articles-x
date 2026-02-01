import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen, Sparkles, Shield, TrendingUp, Bookmark, Eye, Star, Users, Zap, Filter, Award } from 'lucide-react'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { createAnonClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion-wrapper'
import { categoryIdToSlug } from '@/lib/url-utils'

export const metadata: Metadata = {
  title: 'Xarticle — The Best Articles from X, Curated & Scored',
  description: 'Discover the most valuable long-form articles shared on X. AI-powered summaries, quality scoring, and curated content across AI, business, crypto, culture, and more.',
  alternates: {
    canonical: 'https://www.xarticle.news/',
  },
  openGraph: {
    title: 'Xarticle — The Best Articles from X, Curated & Scored',
    description: 'Discover the most valuable long-form articles shared on X. AI-powered summaries, quality scoring, and curated content across AI, business, crypto, culture, and more.',
    url: 'https://www.xarticle.news/',
    siteName: 'Xarticle',
    type: 'website',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Xarticle - Curated Articles from X',
        type: 'image/webp'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xarticle — The Best Articles from X, Curated & Scored',
    description: 'Discover the most valuable long-form articles shared on X. AI-powered summaries, quality scoring, and curated content.',
    images: ['/og-image.webp']
  }
}

// Use ISR for fast loading
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
  tweet_likes: number
  score: number
  summary_english: string | null
  summary_chinese: string | null
  category: string
  main_category: string
  sub_category: string
}

export default async function HomePage() {
  const supabase = createAnonClient()

  const categories = [
    'Hardware', 'Gaming', 'Health', 'Environment', 'Personal Story',
    'Culture', 'Philosophy', 'History', 'Education', 'Design',
    'Marketing', 'AI', 'Crypto', 'Tech', 'Data', 'Startups',
    'Business', 'Markets', 'Product', 'Security', 'Policy',
    'Science', 'Media'
  ]

  // Get date from 7 days ago for weekly top articles
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoISO = sevenDaysAgo.toISOString()

  // Fetch top 3 articles from the past week by views
  const [statsResult, topArticlesResult] = await Promise.all([
    supabase.from('article_stats').select('total_published').eq('id', 1).single(),
    supabase.from('articles')
      .select('id, title, title_english, slug, image, author_name, author_handle, author_avatar, article_published_at, tweet_views, tweet_likes, score, summary_english, summary_chinese, category, main_category, sub_category')
      .eq('indexed', true)
      .gte('score', 60)
      .gte('article_published_at', sevenDaysAgoISO)
      .order('tweet_views', { ascending: false })
      .limit(3)
  ])

  const totalArticles = statsResult.data?.total_published ?? 179
  const topArticles = topArticlesResult.data as TopArticle[] || []

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Xarticle?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Xarticle is a curated platform that discovers, scores, and summarizes the best long-form articles shared on X (Twitter). We use AI to identify high-quality content from thought leaders, founders, and creators, then present it with intelligent summaries and quality scores."
        }
      },
      {
        "@type": "Question",
        "name": "How does Xarticle score articles?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Each article is rated on a 0-100 scale based on multiple factors: engagement metrics (views, likes, replies), content quality, source credibility, and relevance. Only articles scoring 60 or higher are included in our trending feed, ensuring you see only the most valuable content."
        }
      },
      {
        "@type": "Question",
        "name": "How often is Xarticle updated?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our system monitors thousands of X accounts and fetches new articles every 20 minutes. The trending page is continuously updated with fresh, high-scoring content from technology, business, crypto, culture, and more."
        }
      }
    ]
  }

  const homePageSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Xarticle",
    "url": "https://www.xarticle.news/",
    "description": "Curated and scored articles from X (Twitter) with AI-powered summaries",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.xarticle.news/trending?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  const formatViews = (views: number) => {
    if (views >= 1000000000) return (views / 1000000000).toFixed(1) + 'B'
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M'
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K'
    return views.toString()
  }

  const formatScore = (score: number) => {
    if (score >= 95) return { color: 'text-yellow-400', label: 'Exceptional' }
    if (score >= 85) return { color: 'text-green-400', label: 'Excellent' }
    if (score >= 75) return { color: 'text-blue-400', label: 'Great' }
    return { color: 'text-white/60', label: 'Good' }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageSchema) }}
      />
      <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/20 font-sans">
        <ClientNavWrapper categories={categories} />

        {/* Decorative background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
          <div className="absolute bottom-[20%] left-[20%] w-[25%] h-[25%] bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
        </div>

        {/* Hero Section */}
        <section className="relative pt-32 pb-16 px-6 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Hero Content */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                <FadeIn direction="none" delay={0}>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-border text-[10px] font-medium tracking-wider uppercase text-white/50 mb-4 mx-auto lg:mx-0">
                    <Star size={12} className="text-yellow-400" />
                    <span>Quality-Scored Content</span>
                  </div>
                </FadeIn>

                <FadeIn delay={0} distance={30}>
                  <h1 className="text-6xl md:text-8xl font-bold leading-[0.9] tracking-tighter">
                    The best of X,<br />
                    <span className="text-white/40">curated & scored.</span>
                  </h1>
                </FadeIn>

                <FadeIn delay={0} distance={20}>
                  <p className="text-xl text-white/50 max-w-2xl leading-relaxed font-light mx-auto lg:mx-0">
                    We discover, score, and summarize the most valuable long-form articles shared on X. No noise, just quality content with AI-powered insights. Stop scrolling through mediocrity and start reading what actually matters.
                  </p>
                  <p className="text-base text-white/30 max-w-2xl leading-relaxed font-light mt-4 mx-auto lg:mx-0">
                    From AI research and startup wisdom to philosophy and personal growth, we curate content that makes you think, question, and grow. Every article is scored, summarized, and served with zero distractions.
                  </p>
                </FadeIn>

                <FadeIn delay={0} direction="none">
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                    <Link href="/trending">
                      <Button size="lg" className="bg-white text-black hover:bg-white/90 text-sm font-medium px-8 py-6 rounded-full transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        Explore Trending
                        <ArrowRight className="ml-2" size={16} />
                      </Button>
                    </Link>
                    <Link href="#top-articles">
                      <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 text-sm font-medium px-8 py-6 rounded-full transition-all duration-500">
                        View Top Articles
                      </Button>
                    </Link>
                  </div>
                </FadeIn>
              </div>

              {/* Hero Stats */}
              <div className="lg:col-span-5 relative mt-8 lg:mt-0">
                <FadeIn direction="left" distance={40}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-[2rem] bg-card border border-border hover:bg-white/[0.05] transition-all duration-500">
                      <div className="text-4xl font-bold tracking-tighter mb-1">{totalArticles}</div>
                      <div className="text-xs tracking-widest uppercase text-white/30">Curated Articles</div>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-card border border-border hover:bg-white/[0.05] transition-all duration-500">
                      <div className="text-4xl font-bold tracking-tighter mb-1">60+</div>
                      <div className="text-xs tracking-widest uppercase text-white/30">Min Score</div>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-card border border-border hover:bg-white/[0.05] transition-all duration-500">
                      <div className="text-4xl font-bold tracking-tighter mb-1">24/7</div>
                      <div className="text-xs tracking-widest uppercase text-white/30">AI Monitoring</div>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-card border border-border hover:bg-white/[0.05] transition-all duration-500">
                      <div className="text-4xl font-bold tracking-tighter mb-1">EN/ZH</div>
                      <div className="text-xs tracking-widest uppercase text-white/30">Summaries</div>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* Top Articles Section */}
        <section id="top-articles" className="py-20 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Top <span className="text-white/40">This Week.</span>
                </h2>
                <Link href="/trending">
                  <Button variant="ghost" className="text-white/40 hover:text-white hover:bg-white/5">
                    View All
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
              <p className="text-white/40 text-center max-w-2xl mx-auto mb-12">
                The most read articles from the past 7 days. All scored 60+ and curated for quality.
              </p>
            </FadeIn>

            <div className="grid lg:grid-cols-3 gap-6">
              {topArticles.map((article, index) => {
                const scoreInfo = formatScore(article.score)
                const summaryText = article.summary_english || article.summary_chinese || 'A high-quality article from a trusted source on X. Read the full piece for deep insights and valuable perspectives.'
                const shortSummary = summaryText.slice(0, 180) + (summaryText.length > 180 ? '...' : '')
                const categorySlug = categoryIdToSlug(article.category || 'tech:ai')
                const articleUrl = `/article/${categorySlug}/${article.slug}`

                return (
                  <FadeIn key={article.id} delay={0.1 * index} direction="up">
                    <Link href={articleUrl} className="block group">
                      <div className="relative h-full rounded-[2rem] bg-card border border-border hover:border-white/20 transition-all duration-500 overflow-hidden">
                        {/* Article Image */}
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />

                          {/* Score Badge */}
                          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                            <Star size={14} className={scoreInfo.color} />
                            <span className={`text-sm font-bold ${scoreInfo.color}`}>{article.score}</span>
                          </div>

                          {/* Rank Badge */}
                          {index < 3 && (
                            <div className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                              <span className="text-xs font-bold">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          {/* Category */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-white/50">
                              {article.sub_category}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-xl font-bold leading-tight mb-3 group-hover:text-white/80 transition-colors line-clamp-2">
                            {article.title_english || article.title}
                          </h3>

                          {/* Summary */}
                          <p className="text-sm text-white/40 leading-relaxed mb-4 line-clamp-3">
                            {shortSummary}
                          </p>

                          {/* Engagement */}
                          <div className="flex items-center gap-4 text-xs text-white/30 mb-4">
                            <div className="flex items-center gap-1">
                              <Eye size={12} />
                              <span>{formatViews(article.tweet_views)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Sparkles size={12} />
                              <span>{article.tweet_likes?.toLocaleString() || '0'} likes</span>
                            </div>
                          </div>

                          {/* Author */}
                          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10">
                              <Image
                                src={article.author_avatar}
                                alt={article.author_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{article.author_name}</div>
                              <div className="text-xs text-white/30">@{article.author_handle}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </FadeIn>
                )
              })}
            </div>

            {topArticles.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-6">
                  <Sparkles size={32} className="text-white/20" />
                </div>
                <p className="text-white/30 text-sm tracking-widest uppercase">Loading top articles...</p>
              </div>
            )}
          </div>
        </section>

        {/* What is Xarticle Section */}
        <section className="py-20 px-6 relative z-10 border-y border-border">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-12 text-center">
                What is <span className="text-white/40">Xarticle?</span>
              </h2>
            </FadeIn>

            <div className="prose prose-invert max-w-none space-y-8">
              <FadeIn delay={0.1}>
                <p className="text-xl text-white/70 leading-relaxed text-center">
                  Xarticle is an intelligent content discovery platform that monitors thousands of X accounts from founders, venture capitalists, researchers, and thought leaders. When these accounts share long-form articles—essays, blog posts, research papers, and in-depth analyses—our system captures them and uses AI to evaluate, summarize, and organize the content for serious readers.
                </p>
              </FadeIn>

              <FadeIn delay={0.2}>
                <p className="text-lg text-white/60 leading-relaxed text-center">
                  The problem with X is simple: the signal-to-noise ratio is abysmal. Between the hot takes, the self-promotion, and the algorithmic outrage bait, the genuinely valuable content gets buried. That essay about a founder&apos;s hardest-learned lesson? The research paper that could change how you think about AI? The personal story that might actually shift your perspective? They&apos;re there, but finding them means scrolling through hours of mediocrity.
                </p>
              </FadeIn>

              <FadeIn delay={0.25}>
                <p className="text-lg text-white/60 leading-relaxed text-center">
                  Xarticle fixes this by doing the heavy lifting for you. We&apos;ve built a system that knows who&apos;s worth listening to, what qualifies as substantive content, and how to separate insight from noise. Every article we feature has been evaluated against multiple quality dimensions and scored accordingly. This isn&apos;t about engagement farming—it&apos;s about identifying content that actually delivers value.
                </p>
              </FadeIn>

              <FadeIn delay={0.3}>
                <p className="text-lg text-white/60 leading-relaxed text-center">
                  Every article receives a quality score from 0 to 100 based on multiple signals: engagement metrics, source credibility, content depth, and relevance to trending topics. Only articles scoring 60 or higher make it to our curated feed, ensuring you spend your reading time on content that truly matters. The scoring system adapts over time, learning from engagement patterns and user feedback to continuously improve the quality threshold.
                </p>
              </FadeIn>

              <FadeIn delay={0.35}>
                <p className="text-lg text-white/60 leading-relaxed text-center">
                  Our AI generates intelligent summaries in both English and Chinese, giving you quick context before you commit to reading the full piece. Each summary captures the key insights, main arguments, and takeaways—so you can decide whether an article is worth your time before you click through. Browse by category, search by topic, or explore author pages to build your personal knowledge library.
                </p>
              </FadeIn>

              <FadeIn delay={0.4}>
                <p className="text-lg text-white/60 leading-relaxed text-center">
                  This is not another aggregator that simply reposts everything. This is a curated platform with editorial standards applied at scale. The articles you see on Xarticle have been read, evaluated, and summarized by AI systems specifically trained to recognize depth, originality, and substantive argumentation. We&apos;re here to help you discover content that makes you smarter, not just content that keeps you scrolling.
                </p>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-6 relative z-10 border-y border-border">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-center">
                How <span className="text-white/40">it works.</span>
              </h2>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p className="text-lg text-white/50 leading-relaxed text-center max-w-3xl mx-auto mb-16">
                Xarticle operates as a continuous intelligence system, working around the clock to discover, evaluate, and organize the most valuable long-form content shared on X. Here&apos;s the breakdown:
              </p>
            </FadeIn>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: '01',
                  icon: Users,
                  title: 'Monitor',
                  description: 'We track thousands of vetted X accounts—founders, VCs, researchers, and thought leaders who consistently share valuable long-form content. Our source list is continuously refined based on the quality of what they share, not just their follower count.',
                  detail: 'This includes Y Combinator partners writing about startup lessons, AI researchers sharing breakthrough papers, investors analyzing market shifts, and thinkers dissecting complex ideas. We prioritize substance over popularity.'
                },
                {
                  step: '02',
                  icon: Zap,
                  title: 'Capture',
                  description: 'When articles are shared, our system extracts the content, metadata, and engagement signals in real-time, typically within 20 minutes of posting. We fetch the full article content, not just the link—so you get proper summaries.',
                  detail: 'Our crawler handles paywalls, PDFs, and various content management systems. We preserve article structure, extract key passages, and capture metadata like publication date and author information.'
                },
                {
                  step: '03',
                  icon: Award,
                  title: 'Score & Filter',
                  description: 'Each article is evaluated on a 0-100 scale based on engagement quality, source credibility, content depth, and topic relevance. Only content scoring 60+ makes the cut.',
                  detail: 'The scoring algorithm weights substance over virality. An article with 10K reads but original insights scores higher than one with 1M reads of clichéd advice. We learn from user engagement patterns to continuously refine the model.'
                },
                {
                  step: '04',
                  icon: Sparkles,
                  title: 'Summarize',
                  description: 'AI generates intelligent summaries in English and Chinese, capturing key insights and main arguments. Get instant context before diving into the full piece.',
                  detail: 'Our summarization model is trained to identify core theses, supporting arguments, and actionable takeaways. It distinguishes between genuine insight and fluff, giving you the essence without wasting time.'
                }
              ].map((item, i) => (
                <FadeIn key={i} delay={0.1 * i} className="relative group">
                  <div className="text-[10px] font-bold text-white/20 mb-4">{item.step}</div>
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="text-white/60" size={24} />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">{item.title}</h4>
                  <p className="text-sm text-white/40 leading-relaxed mb-4">{item.description}</p>
                  <p className="text-xs text-white/30 leading-relaxed">{item.detail}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Why Xarticle Section */}
        <section className="py-20 px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-12 text-center">
                Why <span className="text-white/40">Xarticle?</span>
              </h2>
            </FadeIn>

            <div className="space-y-12">
              <FadeIn delay={0.1} className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h4 className="text-2xl font-semibold mb-4">The signal problem on X is getting worse</h4>
                  <p className="text-white/50 leading-relaxed">
                    X has become a noisy feed where engagement optimization beats substance. The algorithm promotes outrage, repetition, and shallow takes over deep thinking. As a result, genuinely valuable content—thoughtful essays, rigorous analysis, personal stories with real insight—gets buried under layers of hot takes and engagement bait.
                  </p>
                  <p className="text-white/50 leading-relaxed mt-4">
                    Most users either give up on finding good content or accept the noise as inevitable. We built Xarticle because we believe there&apos;s a better way: a platform that filters for quality first, optimizes for learning over engagement, and respects your time as a reader.
                  </p>
                </div>
                <div className="p-8 rounded-[2rem] bg-card border border-border">
                  <div className="text-5xl font-bold tracking-tighter mb-2 text-white/20">99%</div>
                  <div className="text-sm text-white/30 mb-6">of X is noise</div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Our analysis shows that less than 1% of shared articles meet our quality threshold. Xarticle delivers that 1% directly to you.
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.2} className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-2 md:order-1 p-8 rounded-[2rem] bg-card border border-border">
                  <div className="text-5xl font-bold tracking-tighter mb-2 text-white/20">10x</div>
                  <div className="text-sm text-white/30 mb-6">faster discovery</div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Stop scrolling through mediocre threads. Get straight to articles that actually deliver value, pre-filtered and pre-summarized.
                  </p>
                </div>
                <div className="order-1 md:order-2">
                  <h4 className="text-2xl font-semibold mb-4">Your time is worth more than endless scrolling</h4>
                  <p className="text-white/50 leading-relaxed">
                    Every hour you spend scrolling X in search of good content is an hour lost. The opportunity cost isn&apos;t just time—it&apos;s the mental energy burned on filtering noise that leaves you less capacity for deep work and actual learning.
                  </p>
                  <p className="text-white/50 leading-relaxed mt-4">
                    Xarticle returns that time to you. Instead of hunting for signal in a sea of noise, you get a curated feed of articles that have already passed a quality threshold. Read summaries, pick what interests you, and spend your time on content that actually moves the needle.
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-border text-center">
                  <h4 className="text-2xl font-semibold mb-4">Built for learners, not consumers</h4>
                  <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">
                    Xarticle isn&apos;t designed to maximize your time on site. It&apos;s designed to maximize the value you get from the time you spend. We want you to read fewer articles but better ones—to encounter ideas that challenge your thinking, teach you something new, or help you see things differently. When you find an article worth reading, read it deeply. When you&apos;ve learned what you came for, close the tab and get back to building.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 relative z-10 border-y border-border">
          <div className="max-w-7xl mx-auto text-center lg:text-left">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
                Built for <span className="text-white/40">serious readers.</span>
              </h2>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p className="text-lg text-white/50 leading-relaxed max-w-3xl mx-auto mb-16 text-center">
                Xarticle combines intelligent curation, AI-powered analysis, and thoughtful design to create a reading experience that respects your time and intelligence.
              </p>
            </FadeIn>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Quality Scoring', desc: 'Every article is scored 0-100 based on content depth, source credibility, and engagement quality. Only the best content makes it through.', detail: 'The scoring system weights insight over virality, ensuring that lesser-known but high-quality content gets the attention it deserves.', icon: Award },
                { title: 'AI Summaries', desc: 'Get the gist in seconds with English and Chinese AI-powered summaries that capture key insights and main arguments.', detail: 'Our summarization model distinguishes between genuine insight and fluff, extracting the essence so you can decide what deserves your full attention.', icon: Sparkles },
                { title: 'Fresh Content', desc: 'New articles arrive every 20 minutes from across the X ecosystem. Stay current with ideas as they emerge.', detail: 'Our monitoring system covers thousands of vetted accounts across technology, business, crypto, culture, and more—delivering a diverse stream of high-quality content.', icon: TrendingUp },
                { title: 'Smart Filtering', desc: 'Browse by category, search by topic, or explore specific authors. Find exactly what you need, when you need it.', detail: 'Categories span AI, crypto, startups, philosophy, personal stories, and more. Search cuts through to the substance, not just keywords.', icon: Filter },
                { title: 'Ad-Free Experience', desc: 'Clean interface, no distractions, no algorithms optimized for engagement. Just pure content worth your time.', detail: 'We have no incentive to keep you scrolling. Our goal is to help you find value efficiently, then get back to your work.', icon: Shield },
                { title: 'Author Pages', desc: 'Dive deep into specific thinkers and explore their best work. Follow the voices that consistently deliver insight.', detail: 'Every author page aggregates their highest-scoring articles, letting you trace their thinking over time and discover their best ideas.', icon: Users },
                { title: 'Dual Language', desc: 'Full support for English and Chinese readers. Summaries in both languages bridge global knowledge flows.', detail: 'Read insights from Silicon Valley, Shanghai, and everywhere in between. Great ideas shouldn\'t be trapped behind language barriers.', icon: BookOpen },
                { title: 'Trending Feed', desc: 'See what the community finds valuable. Articles are ranked by quality score, not just raw engagement numbers.', detail: 'The trending page surfaces recent high-scoring articles across all categories, updated continuously as new content arrives.', icon: Zap },
                { title: 'Read Later', desc: 'Save articles for deeper reading. Build a personal library of content worth returning to.', detail: 'Your saved articles sync across devices, letting you collect insights and revisit them when you have time for deep reading.', icon: Bookmark }
              ].map((feature, i) => (
                <FadeIn key={i} delay={0.05 * i} className="group p-8 rounded-[2rem] bg-card border border-border hover:bg-white/[0.08] hover:border-white/10 transition-all duration-500 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <feature.icon className="text-white/70" size={24} />
                  </div>
                  <h4 className="text-xl font-medium mb-3">{feature.title}</h4>
                  <p className="text-white/50 leading-relaxed font-light text-sm mb-3">{feature.desc}</p>
                  <p className="text-white/30 leading-relaxed text-xs">{feature.detail}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Quality Standards Section */}
        <section className="py-20 px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-center">
                Quality <span className="text-white/40">standards.</span>
              </h2>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p className="text-lg text-white/50 leading-relaxed text-center max-w-3xl mx-auto mb-16">
                Not all content is created equal. Our scoring system evaluates every article across multiple dimensions to ensure you only see the best.
              </p>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {[
                {
                  title: 'Content Depth',
                  desc: 'We analyze the substance of each article. Does it offer original insights or just rehash familiar talking points? Are arguments supported with evidence and reasoning?',
                  criteria: ['Original analysis and perspectives', 'Evidence-based claims', 'Nuanced discussion of complexity', 'Practical takeaways or actionable insights']
                },
                {
                  title: 'Source Credibility',
                  desc: 'We evaluate the author\'s expertise and track record. Industry veterans, domain experts, and proven thinkers get priority armchair theorists.',
                  criteria: ['Demonstrated expertise in field', 'Track record of valuable insights', 'First-hand experience or research', 'Recognition by peers']
                },
                {
                  title: 'Engagement Quality',
                  desc: 'Not all engagement is equal. We look for meaningful discussions, thoughtful responses, and sharing patterns that indicate genuine value.',
                  criteria: ['Substantive discussion in replies', 'Shared by other credible accounts', 'Saved and referenced over time', 'Low spam/clickbait signals']
                },
                {
                  title: 'Relevance & Timeliness',
                  desc: 'We prioritize content that addresses current challenges, emerging trends, and timeless principles that readers can apply.',
                  criteria: ['Addresses current market conditions', 'Explains emerging technologies or trends', 'Timeless principles with fresh framing', 'Actionable for target audience']
                }
              ].map((standard, i) => (
                <FadeIn key={i} delay={0.1 * i} className="p-8 rounded-[2rem] bg-card border border-border">
                  <h4 className="text-xl font-semibold mb-3">{standard.title}</h4>
                  <p className="text-sm text-white/50 leading-relaxed mb-6">{standard.desc}</p>
                  <ul className="space-y-2">
                    {standard.criteria.map((c, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-white/30">
                        <div className="w-1 h-1 rounded-full bg-white/30 mt-1.5 flex-shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={0.5}>
              <div className="p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-border text-center">
                <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">
                  Only articles scoring 60 or higher on our 100-point scale make it to the trending feed. This means approximately 99% of content shared on X gets filtered out before you ever see it. We do the filtering so you can do the reading.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Categories Preview */}
        <section className="py-20 px-6 relative z-10 border-y border-border">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Explore <span className="text-white/40">topics.</span>
                </h2>
                <Link href="/trending">
                  <Button variant="ghost" className="text-white/40 hover:text-white hover:bg-white/5">
                    Browse All
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p className="text-lg text-white/50 leading-relaxed text-center max-w-3xl mx-auto mb-12">
                Our curated categories span the breadth of human knowledge and experience. From the latest breakthroughs in AI to timeless wisdom on philosophy and personal growth, find content that matches your interests and curiosity.
              </p>
            </FadeIn>

            <div className="flex flex-wrap gap-3">
              {categories.slice(0, 12).map((cat, i) => (
                <FadeIn key={cat} delay={0.05 * i}>
                  <Link
                    href={`/trending?category=${cat.toLowerCase()}`}
                    className="px-5 py-3 rounded-full bg-white/5 border border-border hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-sm text-white/60 hover:text-white"
                  >
                    {cat}
                  </Link>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={0.3}>
              <p className="text-sm text-white/30 leading-relaxed text-center mt-8 max-w-2xl mx-auto">
                Each category is continuously updated with high-scoring articles. Click any topic to explore the best recent content in that area.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-20 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <FadeIn>
              <p className="text-center text-white/30 text-sm uppercase tracking-widest mb-12">Trusted by serious readers</p>
            </FadeIn>
            <div className="flex flex-col md:flex-row justify-around items-center gap-12">
              <FadeIn delay={0.1} className="text-center">
                <div className="text-5xl font-bold tracking-tighter mb-2">100M+</div>
                <div className="text-xs tracking-widest uppercase text-white/30">Total Article Views</div>
                <p className="text-xs text-white/20 mt-3 max-w-[150px]">Collective reach of articles featured on Xarticle</p>
              </FadeIn>
              <FadeIn delay={0.2} className="text-center">
                <div className="text-5xl font-bold tracking-tighter mb-2">20min</div>
                <div className="text-xs tracking-widest uppercase text-white/30">Update Frequency</div>
                <p className="text-xs text-white/20 mt-3 max-w-[150px]">New content arrives throughout the day, every day</p>
              </FadeIn>
              <FadeIn delay={0.3} className="text-center">
                <div className="text-5xl font-bold tracking-tighter mb-2">0%</div>
                <div className="text-xs tracking-widest uppercase text-white/30">Noise & Clickbait</div>
                <p className="text-xs text-white/20 mt-3 max-w-[150px]">Our scoring system filters out low-quality content</p>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6 z-10 relative">
          <div className="max-w-4xl mx-auto rounded-[3rem] bg-gradient-to-br from-white/[0.08] to-transparent border border-border p-12 md:p-24 text-center">
            <FadeIn>
              <h3 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
                Start reading<br />
                <span className="text-white/40">what matters.</span>
              </h3>
              <p className="text-xl text-white/50 mb-4 max-w-lg mx-auto font-light">
                Escape the algorithmic feed. Discover curated, scored, and summarized articles from the brightest minds on X.
              </p>
              <p className="text-sm text-white/30 mb-12 max-w-lg mx-auto font-light">
                Join thousands of readers who have upgraded their information diet. Stop scrolling endlessly and start learning something new every day.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/trending">
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 text-sm font-medium px-12 py-7 rounded-full shadow-2xl transition-all duration-500 hover:scale-105">
                    Explore Trending
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-6 border-t border-border z-10 relative">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-sm font-bold">X</span>
              </div>
              <span className="text-sm font-medium tracking-tighter text-white/50 uppercase">Xarticle</span>
            </div>

            <div className="flex gap-8 text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium">
              <Link href="/trending" className="hover:text-white transition-colors">Trending</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <a href="https://x.com" className="hover:text-white transition-colors">X.com</a>
            </div>

            <div className="text-[10px] text-white/20 tracking-widest font-light">
              © 2026 XARTICLE. CURATED WITH INTEGRITY.
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

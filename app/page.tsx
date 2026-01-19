import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen, Globe, Sparkles, Shield, TrendingUp, Bookmark, Eye } from 'lucide-react'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion-wrapper'

export const metadata: Metadata = {
  title: 'Xarticle — The Best Articles from X, Curated and Summarized',
  description: 'Discover the most valuable long-form articles shared on X. Read crisp summaries, browse by topic or account, and save your personal must-read list.',
  alternates: {
    canonical: 'https://www.xarticle.news/',
  },
  openGraph: {
    title: 'Xarticle — The Best Articles from X, Curated and Summarized',
    description: 'Discover the most valuable long-form articles shared on X. Read crisp summaries, browse by topic or account, and save your personal must-read list.',
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
    title: 'Xarticle — The Best Articles from X, Curated and Summarized',
    description: 'Discover the most valuable long-form articles shared on X. Read crisp summaries, browse by topic or account, and save your personal must-read list.',
    images: ['/og-image.webp']
  }
}

// Use ISR for fast loading
export const revalidate = 300

export default async function HomePage() {
  const supabase = await createClient()

  const categories = [
    'Hardware', 'Gaming', 'Health', 'Environment', 'Personal Story',
    'Culture', 'Philosophy', 'History', 'Education', 'Design',
    'Marketing', 'AI', 'Crypto', 'Tech', 'Data', 'Startups',
    'Business', 'Markets', 'Product', 'Security', 'Policy',
    'Science', 'Media'
  ]

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  // Parallel data fetching for better performance
  const [userResult, countResult, articlesResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('articles')
      .select('id, title, slug, summary_english, author_handle, tweet_views')
      .eq('language', 'en')
      .gte('article_published_at', sevenDaysAgoISO)
      .not('summary_english', 'is', null)
      .neq('summary_english', '')
      .order('tweet_views', { ascending: false })
      .limit(3)
  ])

  const user = userResult.data?.user
  const totalArticles = countResult.count
  const trendingArticles = articlesResult.data

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does Xarticle find articles?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We monitor thousands of X accounts from founders, VCs, researchers, and thought leaders. Our AI identifies when they share long-form articles and automatically curates the best content."
        }
      }
    ]
  }

  const homePageSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Xarticle",
    "url": "https://www.xarticle.news/",
    "description": "Curated articles from X (Twitter) with AI-powered summaries",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.xarticle.news/trending?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
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
        <ClientNavWrapper initialUser={user} categories={categories} />

        {/* Decorative background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-white/[0.03] rounded-full blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-white/[0.03] rounded-full blur-[120px]" />
        </div>

        <section className="relative pt-40 pb-20 px-6 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Hero Content */}
              <div className="lg:col-span-7 space-y-10 text-center lg:text-left">
                <FadeIn direction="none" delay={0.1}>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-border text-[10px] font-medium tracking-wider uppercase text-white/50 mb-4 mx-auto lg:mx-0">
                    <Sparkles size={12} className="text-white" />
                    <span>AI-Curated Excellence</span>
                  </div>
                </FadeIn>

                <FadeIn delay={0.2} distance={30}>
                  <h1 className="text-6xl md:text-8xl font-bold leading-[0.9] tracking-tighter">
                    Read the best of <br />
                    <span className="text-white/40 text-glow">X platform.</span>
                  </h1>
                </FadeIn>

                <FadeIn delay={0.3} distance={20}>
                  <p className="text-xl text-white/50 max-w-lg leading-relaxed font-light mx-auto lg:mx-0">
                    The absolute 1% of long-form content on X, filtered and organized for serious readers. No noise, just value.
                  </p>
                </FadeIn>

                <FadeIn delay={0.4} direction="none">
                  <div className="flex flex-col sm:flex-row gap-6 pt-4 justify-center lg:justify-start">
                    <Link href="/trending">
                      <Button size="lg" className="bg-white text-black hover:bg-white/90 text-sm font-medium px-10 py-7 rounded-full transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        Explore Collection
                        <ArrowRight className="ml-2" size={16} />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 text-sm font-medium px-10 py-7 rounded-full transition-all duration-500">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </FadeIn>
              </div>

              {/* Hero Highlight - Featured Article */}
              <div className="lg:col-span-5 relative mt-12 lg:mt-0">
                {trendingArticles && trendingArticles.length > 0 ? (
                  <FadeIn direction="left" distance={40} className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-white/5 to-transparent rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Link href={`/article/${trendingArticles[0].slug}`} className="block relative overflow-hidden rounded-[2.5rem] border border-border bg-card p-8 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.08] shadow-2xl">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="px-3 py-1 rounded-full bg-white/10 border border-border text-[10px] uppercase tracking-widest font-bold text-white/60">
                            Weekly Highlight
                          </div>
                          <div className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-white/30">
                            <Eye size={10} /> {trendingArticles[0].tweet_views ? (trendingArticles[0].tweet_views / 1000).toFixed(1) + 'k' : '0'}
                          </div>
                        </div>

                        <h3 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-white transition-colors">
                          {trendingArticles[0].title}
                        </h3>

                        <p className="text-white/40 text-sm leading-relaxed font-light line-clamp-3">
                          {trendingArticles[0].summary_english || "Discover this week's most impactful long-form content, hand-curated and summarized by AI."}
                        </p>

                        <div className="pt-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/60">
                            {trendingArticles[0].author_handle?.charAt(0).toUpperCase() || 'X'}
                          </div>
                          <span className="text-xs font-medium text-white/30">@{trendingArticles[0].author_handle || 'source'}</span>
                        </div>
                      </div>
                    </Link>
                  </FadeIn>
                ) : (
                  <div className="h-[400px] rounded-[2.5rem] bg-card border border-border animate-pulse flex items-center justify-center">
                    <span className="text-white/20 text-sm tracking-widest uppercase">Loading Weekly Highlight...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section - Minimal Modern Grid */}
        <section className="py-32 px-6 relative z-10">
          <div className="max-w-7xl mx-auto text-center lg:text-left">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-20">
                Engineered for <br />
                <span className="text-white/40">focused reading.</span>
              </h2>
            </FadeIn>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Fresh Daily', desc: 'New articles arrive every 20 minutes, ready when you are.', icon: TrendingUp },
                { title: 'Clear Summaries', desc: 'Know what matters before you commit to reading.', icon: Sparkles },
                { title: 'Search Freely', desc: 'Find exactly what you need, no algorithms involved.', icon: Globe },
                { title: 'Pure Feed', desc: 'Chronological flow. No notifications, no urgency.', icon: Shield },
                { title: 'Read Anywhere', desc: 'AI translations in your language, on your time.', icon: BookOpen },
                { title: 'Your Library', desc: 'Save what resonates. Build slowly, return often.', icon: Bookmark },
              ].map((benefit, i) => (
                <FadeIn key={i} delay={0.1 * i} className="group p-8 rounded-[2rem] bg-card border border-border hover:bg-white/[0.08] hover:border-white/10 transition-all duration-500 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                    <benefit.icon className="text-white/70" size={24} />
                  </div>
                  <h4 className="text-xl font-medium mb-3">{benefit.title}</h4>
                  <p className="text-white/40 leading-relaxed font-light">{benefit.desc}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof Stats */}
        <section className="py-20 px-6 border-y border-border z-10 relative">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-around items-center gap-12">
            <FadeIn delay={0.1} className="text-center">
              <div className="text-5xl font-bold tracking-tighter mb-2">{totalArticles?.toLocaleString() || '2,500'}+</div>
              <div className="text-xs tracking-widest uppercase text-white/30">Curated Articles</div>
            </FadeIn>
            <FadeIn delay={0.2} className="text-center">
              <div className="text-5xl font-bold tracking-tighter mb-2">15m</div>
              <div className="text-xs tracking-widest uppercase text-white/30">Update Frequency</div>
            </FadeIn>
            <FadeIn delay={0.3} className="text-center">
              <div className="text-5xl font-bold tracking-tighter mb-2">100%</div>
              <div className="text-xs tracking-widest uppercase text-white/30">Ad-Free Feed</div>
            </FadeIn>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-40 px-6 z-10 relative">
          <div className="max-w-4xl mx-auto rounded-[3rem] bg-gradient-to-br from-white/[0.08] to-transparent border border-border p-12 md:p-24 text-center">
            <FadeIn>
              <h3 className="text-5xl md:text-7xl font-bold tracking-tighter mb-10">
                Join the <br />
                serious readers.
              </h3>
              <p className="text-xl text-white/50 mb-12 max-w-lg mx-auto font-light">
                Escape the endless scroll. Start building your personal library today.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                {user ? (
                  <Link href="/trending">
                    <Button size="lg" className="bg-white text-black hover:bg-white/90 text-sm font-medium px-12 py-7 rounded-full shadow-2xl transition-all duration-500 hover:scale-105">
                      Go to Feed
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg" className="bg-white text-black hover:bg-white/90 text-sm font-medium px-12 py-7 rounded-full shadow-2xl transition-all duration-500 hover:scale-105">
                        Create Free Account
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 text-sm font-medium px-12 py-7 rounded-full transition-all duration-500">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="py-20 px-6 border-t border-border z-10 relative">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Logo" width={28} height={28} className="invert opacity-50" />
              <span className="text-sm font-medium tracking-tighter text-white/50 uppercase">Xarticle</span>
            </div>

            <div className="flex gap-10 text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <a href="https://x.com" className="hover:text-white transition-colors">X.com</a>
            </div>

            <div className="text-[10px] text-white/20 tracking-widest font-light">
              © 2026 XARTICLE. BUILT FOR VALUE.
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

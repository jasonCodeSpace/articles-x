import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Shield, Mail, Globe, Sparkles, Zap, Layout, TrendingUp, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { FadeIn, StaggerContainer } from '@/components/motion-wrapper'

export const metadata: Metadata = {
  title: 'About Xarticle | Discover the Best Long-Form Content from X',
  description: 'Xarticle curates the top 1% of long-form articles shared on X. AI-powered bilingual summaries, smart discovery, and a reading experience built for serious minds. No algorithms, no noise—just quality content.',
  alternates: {
    canonical: 'https://www.xarticle.news/about',
    languages: {
      'x-default': 'https://www.xarticle.news/about',
      'en': 'https://www.xarticle.news/about',
    }
  },
  robots: 'index, follow'
}

export default async function About() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const categories: string[] = []

  // Schema.org structured data for About page
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Xarticle",
    "url": "https://www.xarticle.news",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.xarticle.news/og-image.webp",
      "width": 1200,
      "height": 630
    },
    "description": "Xarticle is an AI-driven content curation platform that discovers, organizes, and summarizes high-quality long-form articles from X (formerly Twitter) with bilingual AI-powered summaries.",
    "sameAs": [
      "https://twitter.com/xarticle_news",
      "https://www.xarticle.news"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "hi@xarticle.news",
      "url": "https://www.xarticle.news/about"
    },
    "founder": "Xarticle Team",
    "foundingDate": "2025",
    "areaServed": "Worldwide",
    "knowsLanguage": ["en", "zh"],
    "slogan": "The Best Articles from X, Curated and Summarized"
  }

  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Xarticle",
    "description": "Learn about Xarticle - a content curation platform that discovers, organizes, and summarizes high-quality long-form articles from X with AI-powered bilingual summaries.",
    "url": "https://www.xarticle.news/about",
    "mainEntity": {
      "@type": "Organization",
      "name": "Xarticle",
      "url": "https://www.xarticle.news"
    },
    "subjectOf": {
      "@type": "CreativeWork",
      "name": "Xarticle Platform",
      "description": "AI-powered article curation from X with bilingual summaries",
      "keywords": ["article curation", "AI summaries", "Twitter content", "X platform", "bilingual", "content discovery"]
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
      <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/20 font-sans">
        <ClientNavWrapper initialUser={user} categories={categories} />

        {/* Decorative background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
          <div className="absolute bottom-[20%] -right-[10%] w-[30%] h-[30%] bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
        </div>

        <main className="relative z-10 mx-auto max-w-5xl px-6 pt-40 pb-20">
          {/* Hero Section */}
          <section className="mb-20">
            <header className="max-w-3xl">
              <FadeIn delay={0.2} distance={30}>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                  The best of X, <br />
                  <span className="text-white/40">curated for clarity.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.3} distance={20}>
                <p className="text-lg text-white/50 font-light leading-relaxed">
                  Xarticle is an intelligent lens that focuses on the top 1% of long-form content shared on X. Every day, founders, researchers, and thought leaders share remarkable articles—but they're buried beneath millions of posts. We find them, summarize them, and organize them so you can spend your time reading, not searching.
                </p>
              </FadeIn>
            </header>
          </section>

          {/* The Story Section */}
          <section className="mb-20">
            <StaggerContainer>
              <FadeIn delay={0.2} distance={20} className="prose prose-invert max-w-none">
                <h2 className="text-2xl font-bold mb-6 text-white/80">Why Xarticle exists</h2>
                <div className="text-white/40 leading-relaxed font-light space-y-4">
                  <p>
                    X has become one of the most valuable sources of quality content on the internet. The world's most interesting people—venture capitalists, engineers, scientists, entrepreneurs—use it to share what they're reading. But there's a problem: the signal is drowning in the noise.
                  </p>
                  <p>
                    We built Xarticle to solve this. Our systems monitor thousands of carefully selected X accounts, identifying when they share long-form articles worth your attention. Not hot takes. Not threads. Not memes. Just substantive articles—blog posts, essays, research papers, deep dives—that deserve more than a fleeting glance.
                  </p>
                  <p>
                    Every article passes through our quality filter before it reaches your feed. We analyze engagement, source credibility, content depth, and relevance. Only articles scoring 65 or higher make the cut. This isn't about popularity; it's about finding content that provides genuine value, insight, or perspective.
                  </p>
                </div>
              </FadeIn>
            </StaggerContainer>
          </section>

          {/* Content Grid */}
          <StaggerContainer>
            <div className="space-y-6">

              {/* What We Do Section */}
              <section className="mb-12">
                <FadeIn delay={0.2} distance={20} className="prose prose-invert max-w-none">
                  <h2 className="text-2xl font-bold mb-6 text-white/80">How it works</h2>
                  <div className="text-white/40 leading-relaxed font-light space-y-4">
                    <p>
                      Xarticle runs continuously, updating every 15 minutes with fresh content. Our pipeline is simple but powerful: discover, analyze, summarize, and present. We track curated lists of X accounts across technology, business, science, crypto, design, and more. When these accounts share an article, our systems extract the URL, fetch the content, and determine whether it meets our quality standards.
                    </p>
                    <p>
                      For every qualifying article, we generate bilingual summaries in English and Chinese using advanced language models. These summaries aren't just extracts—they capture the core argument, key insights, and main takeaways, giving you enough context to decide whether the full article is worth your time. You get the gist in seconds, not minutes.
                    </p>
                    <p>
                      The result is a continuously updating feed of high-quality content, organized by category, searchable by keyword or author, and completely free of algorithmic manipulation. No engagement bait. No infinite scroll traps. Just articles worth reading, presented in a clean interface designed for focus.
                    </p>
                  </div>
                </FadeIn>
              </section>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

              {/* AI Summary Card */}
              <FadeIn className="group p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Sparkles size={18} className="text-white/60" />
                  </div>
                  <h3 className="text-lg font-bold">Bilingual AI Summaries</h3>
                </div>
                <p className="text-sm text-white/40 leading-relaxed font-light">
                  Every article receives a custom summary in both English and Chinese. Our AI captures the core argument, key insights, and main takeaways—giving you the essence in seconds.
                </p>
              </FadeIn>

              {/* Quality Score Card */}
              <FadeIn className="group p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Shield size={18} className="text-white/60" />
                  </div>
                  <h3 className="text-lg font-bold">Quality Scoring</h3>
                </div>
                <p className="text-sm text-white/40 leading-relaxed font-light">
                  Each article is scored on depth, credibility, and engagement. Only content scoring 65+ makes it to your feed—ensuring quality over popularity.
                </p>
              </FadeIn>

              {/* Trending Card */}
              <FadeIn className="group p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <TrendingUp className="text-white/60" size={18} />
                  </div>
                  <h3 className="text-lg font-bold">Trending & Archive</h3>
                </div>
                <p className="text-sm text-white/40 leading-relaxed font-light">
                  Browse what's hot right now on Trending, or explore the full Archive. Both views are searchable, filterable, and completely chronological.
                </p>
              </FadeIn>

              {/* Personalization Card */}
              <FadeIn className="group p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Bookmark className="text-white/60" size={18} />
                  </div>
                  <h3 className="text-lg font-bold">Your Personal Library</h3>
                </div>
                <p className="text-sm text-white/40 leading-relaxed font-light">
                  Save articles that resonate with your personal library. Build a collection slowly, return to it often—reading at your own pace.
                </p>
              </FadeIn>
              </div>

              {/* Who It's For Section */}
              <section className="mb-12">
                <FadeIn delay={0.2} distance={20} className="prose prose-invert max-w-none">
                  <h2 className="text-2xl font-bold mb-6 text-white/80">Who is Xarticle for</h2>
                  <div className="text-white/40 leading-relaxed font-light space-y-4">
                    <p>
                      Xarticle is built for curious minds who want to stay informed without sacrificing their attention to the algorithm. It's for technology professionals who need to track industry developments but can't afford to scroll through noise all day. It's for investors and founders who want to understand emerging trends before they become mainstream.
                    </p>
                    <p>
                      It's for researchers and academics who discover valuable references through social networks but lack an efficient way to organize them. It's for bilingual readers who appreciate content in both English and Chinese. Most importantly, it's for anyone who believes that reading should be a deliberate act, not an endless stream of dopamine hits.
                    </p>
                    <p>
                      Whether you're exploring AI breakthroughs, crypto analysis, startup wisdom, design principles, or scientific discoveries, Xarticle helps you find what matters—without the distraction. If you've ever closed a social media app feeling drained rather than informed, this platform is for you.
                    </p>
                    <p>
                      The common thread among our users is a desire for depth over breadth. They don't want to skim a hundred headlines—they want to read three articles that actually change how they think. That's the Xarticle promise: quality over quantity, every single day.
                    </p>
                  </div>
                </FadeIn>
              </section>

              {/* Categories Section */}
              <section className="mb-12">
                <FadeIn delay={0.2} distance={20} className="prose prose-invert max-w-none">
                  <h2 className="text-2xl font-bold mb-6 text-white/80">Topics we cover</h2>
                  <div className="text-white/40 leading-relaxed font-light space-y-4">
                    <p>
                      Our curation spans the disciplines that shape our world. Technology and AI coverage keeps you ahead of innovation curves with insights from researchers and practitioners building the future. Business and startup content delivers operational wisdom from those who've built companies at scale. Markets and crypto analysis provides perspectives you won't find in mainstream financial media—often from investors with skin in the game.
                    </p>
                    <p>
                      We track breakthroughs in science and health research, curating papers and analyses that matter. We feature insights on design, product development, and marketing strategy from practitioners who've done the work. Our coverage extends to culture, philosophy, history, and education—writing that challenges assumptions and expands perspectives beyond the immediate horizon.
                    </p>
                    <p>
                      Each article is automatically categorized, so you can filter your feed by interest. Follow AI specifically, or broaden your scope to all technology coverage. Focus on business fundamentals, or explore markets and economics. Filter by hardware, gaming, security, policy, or media. The choice is yours—our job is to ensure quality, regardless of category.
                    </p>
                    <p>
                      Unlike social media algorithms that show you more of what you've already engaged with, our category system lets you explore deliberately. Want to understand a new field? Subscribe to that category and see the best writing, hand-selected from X's most knowledgeable voices.
                    </p>
                  </div>
                </FadeIn>
              </section>

              {/* Principles & Values Section */}
              <section className="mb-12">
                <FadeIn delay={0.2} distance={20} className="prose prose-invert max-w-none">
                  <h2 className="text-2xl font-bold mb-6 text-white/80">What we believe</h2>
                  <div className="text-white/40 leading-relaxed font-light space-y-4">
                    <p>
                      We believe the internet needs more signal and less noise. The current model of social media incentivizes outrage, urgency, and superficial engagement. We're building something different—a space where quality content can surface without being packaged for virality.
                    </p>
                    <p>
                      We respect creators. Every article on Xarticle links directly to its original source. We never rehost content without permission. Our AI summaries are clearly labeled as summaries, not original work. We're here to amplify great writing, not replace it. When you find something valuable through Xarticle, we want you to engage with it where the creator published it.
                    </p>
                    <p>
                      We believe in reading over skimming, depth over breadth, and insights over hot takes. The platform is designed for serious readers who want to learn, grow, and stay informed without falling into the endless scroll trap. Our goal isn't to maximize time on site—it's to maximize the value of the time you spend.
                    </p>
                    <p>
                      We also believe in transparency. Our scoring system is described openly. Our sources—the X accounts we follow—are listed. Our summaries are generated by AI, but they're clearly marked as such. We don't pretend to be something we're not, and we don't hide how the platform works.
                    </p>
                  </div>
                </FadeIn>
              </section>

              {/* The Difference Section */}
              <section className="mb-12">
                <FadeIn delay={0.2} distance={20} className="prose prose-invert max-w-none">
                  <h2 className="text-2xl font-bold mb-6 text-white/80">The Xarticle difference</h2>
                  <div className="text-white/40 leading-relaxed font-light space-y-4">
                    <p>
                      What makes Xarticle different from RSS readers, social media feeds, or newsletter aggregators? It starts with our source: X (formerly Twitter) has become the primary way interesting people share interesting things. By monitoring curated lists of accounts rather than arbitrary RSS feeds, we tap into a human filter that algorithms can't replicate.
                    </p>
                    <p>
                      Unlike social media, we don't track your behavior to optimize for engagement. There are no like buttons, no comment sections, no viral loops. The feed is organized by quality score and recency—not by what will keep you clicking. You can visit once a day or once a week; the content will be waiting, organized and ready.
                    </p>
                    <p>
                      Unlike newsletters, we don't flood your inbox. We don't impose editorial voice or selection bias beyond our quality threshold. We don't bundle content into themed issues that may or may not interest you. Instead, we give you tools to explore—search, filter, categorize—so you can find what you need, when you need it.
                    </p>
                  </div>
                </FadeIn>
              </section>

              {/* Commitment Card - Full Width */}
              <FadeIn className="group relative p-8 md:p-10 rounded-3xl bg-white/[0.03] border border-white/5 overflow-hidden hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                <div className="absolute top-8 right-8 md:top-10 md:right-10">
                  <Target size={32} className="text-white/10 group-hover:text-white/20 transition-colors" />
                </div>
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-bold mb-4">Our Commitment</h2>
                  <p className="text-white/40 leading-relaxed font-light">
                    We're building Xarticle to be a resource you can trust—no paywalls, no affiliate links masking as recommendations, no sponsored content masquerading as editorial. Just articles worth reading, presented without manipulation.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/40">
                      Ad-Free
                    </span>
                    <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/40">
                      No Algorithms
                    </span>
                    <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/40">
                      Creator Friendly
                    </span>
                  </div>
                </div>
              </FadeIn>

              {/* Contact & Community Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Card */}
                <FadeIn className="group p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-2">Get in Touch</h3>
                      <p className="text-sm text-white/40 font-light">Questions or partnerships?</p>
                    </div>
                    <div className="flex gap-3">
                      <a href="mailto:hi@xarticle.news" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Mail size={16} className="text-white/40 hover:text-white transition-colors" />
                      </a>
                      <a href="https://twitter.com/xarticle_news" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white/40 hover:fill-white transition-colors"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      </a>
                    </div>
                  </div>
                </FadeIn>

                {/* Contribute Card */}
                <FadeIn className="group p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Suggest a Source</h3>
                    <p className="text-sm text-white/40 font-light mb-4">Know an X account we should follow?</p>
                    <a href="mailto:hi@xarticle.news?subject=Source Suggestion" className="text-sm text-white/60 hover:text-white transition-colors underline underline-offset-4 decoration-white/20">
                      Let us know →
                    </a>
                  </div>
                </FadeIn>
              </div>
            </div>
          </StaggerContainer>

          {/* Footer Actions */}
          <section className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium flex gap-6">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
            <Button size="lg" className="bg-white text-black hover:bg-white/90 text-sm font-medium px-8 py-6 rounded-full transition-all duration-300 hover:scale-105" asChild>
              <Link href="/trending">Explore Articles</Link>
            </Button>
          </section>
        </main>
      </div>
    </>
  )
}

import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Shield, Mail, Globe, Sparkles, Zap, Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { FadeIn, StaggerContainer } from '@/components/motion-wrapper'

export const metadata: Metadata = {
  title: 'About Xarticle | AI-Powered Article Curation',
  description: 'Learn about Xarticle - a content curation platform that discovers, organizes, and summarizes high-quality long-form articles from X with AI-powered bilingual summaries.',
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
            <header className="max-w-2xl">
              <FadeIn delay={0.2} distance={30}>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                  Curating the <br />
                  <span className="text-white/40">excellence of X.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.3} distance={20}>
                <p className="text-lg text-white/50 font-light leading-relaxed">
                  Xarticle is an AI-driven lens focusing on the absolute 1% of long-form content shared on X. We don&apos;t just aggregate; we refine, summarize, and organize for the serious reader.
                </p>
              </FadeIn>
            </header>
          </section>

          {/* Content Grid */}
          <StaggerContainer>
            <div className="space-y-6">

              {/* Mission Card - Full Width */}
              <FadeIn className="group relative p-8 md:p-10 rounded-3xl bg-white/[0.03] border border-white/5 overflow-hidden hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                <div className="absolute top-8 right-8 md:top-10 md:right-10">
                  <Target size={32} className="text-white/10 group-hover:text-white/20 transition-colors" />
                </div>
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                  <p className="text-white/40 leading-relaxed font-light">
                    Insight is scarce. In an age of algorithmic noise, we believe in curated excellence. Every article on Xarticle is selected for depth, original thought, and long-term value.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/40">
                      Precision AI
                    </span>
                    <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/40">
                      Smart Discovery
                    </span>
                  </div>
                </div>
              </FadeIn>

              {/* Two Column Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Summary Card */}
                <FadeIn className="group p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Sparkles size={18} className="text-white/60" />
                    </div>
                    <h3 className="text-lg font-bold">AI Summaries</h3>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed font-light">
                    Original bilingual summaries in English and Chinese, capturing the essence of every thread and article instantly.
                  </p>
                </FadeIn>

                {/* Extraction Card */}
                <FadeIn className="group p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Zap size={18} className="text-white/60" />
                    </div>
                    <h3 className="text-lg font-bold">Smart Extraction</h3>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed font-light">
                    Our systems monitor thousands of leading voices to identify content with substantial long-form depth.
                  </p>
                </FadeIn>
              </div>

              {/* System Architecture - Full Width */}
              <FadeIn className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10">
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 mb-8">How It Works</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                  {[
                    { label: 'Discover', icon: Globe, desc: 'Monitor curated X lists' },
                    { label: 'Analyze', icon: Zap, desc: 'Identify quality content' },
                    { label: 'Summarize', icon: Sparkles, desc: 'Generate bilingual AI summaries' },
                    { label: 'Deliver', icon: Layout, desc: 'Present in clean interface' }
                  ].map((step, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <step.icon size={14} className="text-white/40" />
                        <span className="font-semibold text-sm">{step.label}</span>
                      </div>
                      <p className="text-white/30 text-xs font-light leading-relaxed">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Two Column Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Commitment Card */}
                <FadeIn className="group p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Shield size={18} className="text-white/60" />
                    </div>
                    <h3 className="text-lg font-bold">Our Commitment</h3>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed font-light">
                    We respect creators. Every article links directly to the original source. AI summaries are clearly labeled. Excellence over clickbait.
                  </p>
                </FadeIn>

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

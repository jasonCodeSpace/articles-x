import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Newspaper, Target, Workflow, Shield, Mail, Globe, Sparkles, Zap, Layout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { FadeIn, StaggerContainer } from '@/components/motion-wrapper'

export const metadata: Metadata = {
  title: 'About Xarticle | AI-Powered Article Curation',
  description: 'Learn about Xarticle - a content curation platform that discovers, organizes, and summarizes high-quality long-form articles from X with AI-powered bilingual summaries.',
  robots: 'index, follow'
}

export default async function About() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const categories = [
    'Hardware', 'Gaming', 'Health', 'Environment', 'Personal Story',
    'Culture', 'Philosophy', 'History', 'Education', 'Design',
    'Marketing', 'AI', 'Crypto', 'Tech', 'Data', 'Startups',
    'Business', 'Markets', 'Product', 'Security', 'Policy',
    'Science', 'Media'
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/20 font-sans">
      <ClientNavWrapper initialUser={user} categories={categories} />

      {/* Decorative background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-white/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] -right-[10%] w-[30%] h-[30%] bg-white/[0.02] rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-40 pb-20">
        {/* Hero Section */}
        <section className="mb-24">
          <FadeIn direction="none" delay={0.1}>
            <Link href="/" className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 hover:text-white transition-colors mb-12 group">
              <ArrowLeft className="w-3 h-3 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Collection
            </Link>
          </FadeIn>

          <header className="max-w-3xl">
            <FadeIn delay={0.2} distance={30}>
              <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
                Curating the <br />
                <span className="text-white/40">excellence of X.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.3} distance={20}>
              <p className="text-xl text-white/50 font-light leading-relaxed">
                Xarticle is an AI-driven lens focusing on the absolute 1% of long-form content shared on X. We don't just aggregate; we refine, summarize, and organize for the serious reader.
              </p>
            </FadeIn>
          </header>
        </section>

        {/* Bento Grid Content */}
        <StaggerContainer staggerChildren={0.1} delayChildren={0.4}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[250px] md:auto-rows-[300px]">
            {/* Mission Card */}
            <FadeIn className="md:col-span-8 md:row-span-2 group relative p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 overflow-hidden hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 shadow-2xl">
              <div className="absolute top-0 right-0 p-10">
                <Target size={40} className="text-white/10 group-hover:text-white/20 transition-colors" />
              </div>
              <div className="h-full flex flex-col justify-end">
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-white/40 text-lg leading-relaxed font-light max-w-xl">
                  Insight is scarce. In an age of algorithmic noise, we believe in curated excellence. Every article on Xarticle is selected for depth, original thought, and long-term value.
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/40 group-hover:text-white/60 transition-colors">
                    Precision AI
                  </div>
                  <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/40 group-hover:text-white/60 transition-colors">
                    Smart Discovery
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* AI Summary Card */}
            <FadeIn className="md:col-span-4 md:row-span-1 group p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-white/5">
                  <Sparkles size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-bold">AI Summaries</h3>
              </div>
              <p className="text-sm text-white/40 leading-relaxed font-light">
                Original bilingual summaries in English and Chinese, capturing the essence of every thread and article instantly.
              </p>
            </FadeIn>

            {/* Extraction Card */}
            <FadeIn className="md:col-span-4 md:row-span-1 group p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-white/5">
                  <Zap size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-bold">Extraction</h3>
              </div>
              <p className="text-sm text-white/40 leading-relaxed font-light">
                Our systems monitor thousands of leading voices to identify content with substantial long-form depth.
              </p>
            </FadeIn>

            {/* How it Works - Full Width */}
            <FadeIn className="md:col-span-12 md:row-span-1 group p-10 rounded-[2.5rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 transition-all duration-500">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 mb-8">System Architecture</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { label: 'Discover', icon: Globe, desc: 'Monitor X lists' },
                  { label: 'Analyze', icon: Newspaper, desc: 'Pattern matching' },
                  { label: 'Summarize', icon: Sparkles, desc: 'Bilingual AI' },
                  { label: 'Deliver', icon: Layout, desc: 'Clean UI' }
                ].map((step, i) => (
                  <div key={i} className="space-y-3">
                    <div className="text-white flex items-center gap-3">
                      <step.icon size={16} className="text-white/60" />
                      <span className="font-bold text-sm">{step.label}</span>
                    </div>
                    <div className="text-white/30 text-xs font-light">{step.desc}</div>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Commitment Card */}
            <FadeIn className="md:col-span-6 md:row-span-1 group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-500">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <Shield size={20} className="text-white/40" />
                Our Commitment
              </h3>
              <p className="text-sm text-white/30 font-light leading-relaxed">
                We respect creators. Every article links directly to the original source. AI summaries are clearly labeled. Excellence over clickbait.
              </p>
            </FadeIn>

            {/* Contact Card */}
            <FadeIn className="md:col-span-6 md:row-span-1 p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all duration-500 flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Get in Touch</h3>
                <p className="text-sm text-white/30 font-light">Questions or partnerships?</p>
              </div>
              <div className="flex gap-4">
                <a href="mailto:hi@xarticle.news" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors group">
                  <Mail size={18} className="text-white/40 group-hover:text-white transition-colors" />
                </a>
                <a href="https://twitter.com/xarticle_news" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors group">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white/40 group-hover:fill-white transition-colors"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
              </div>
            </FadeIn>
          </div>
        </StaggerContainer>

        {/* Footer Actions */}
        <section className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium flex gap-8">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
          <Button size="lg" className="bg-white text-black hover:bg-white/90 text-sm font-medium px-12 py-7 rounded-full shadow-2xl transition-all duration-500 hover:scale-105" asChild>
            <Link href="/trending">Explore the Collection</Link>
          </Button>
        </section>
      </main>
    </div>
  )
}

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Clock, Globe, Sparkles } from 'lucide-react'
import { ModernNav } from '@/components/modern-nav'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Articles X - Discover Quality Articles',
  description: 'Discover curated articles from top creators across the web. Stay informed with daily and weekly content.',
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get categories for navigation
  const { data: categoriesData } = await supabase
    .from('articles')
    .select('category')
    .not('category', 'is', null)
  
  const categories = [...new Set(categoriesData?.map((item: { category: string }) => item.category).filter(Boolean) || [])] as string[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <ModernNav user={user ? { id: user.id, email: user.email, user_metadata: user.user_metadata } : undefined} categories={categories} />
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-foreground rounded-full flex items-center justify-center hover:bg-muted transition-all duration-300 group-hover:scale-110">
                <span className="text-lg font-black text-background">𝕏</span>
              </div>
              <span className="text-2xl font-bold text-foreground group-hover:text-accent-foreground transition-colors">articles</span>
            </div>
          </div>

          {/* Hero Text */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Discover Quality
              <span className="text-accent-foreground"> Articles</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Curated content from top creators across the web. Stay informed with daily insights and weekly deep dives.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/new">
              <button className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full font-medium hover:bg-muted transition-all duration-300 hover:scale-105">
                <BookOpen size={20} />
                Start Reading
                <ArrowRight size={16} />
              </button>
            </Link>
            <Link href="/history">
              <button className="flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-full font-medium hover:bg-accent/50 transition-all duration-300">
                <Clock size={20} />
                Browse History
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Daily Articles */}
          <div className="text-center space-y-4 p-6 rounded-2xl border border-border hover:bg-accent/20 transition-all duration-300">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="text-accent-foreground" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Daily Articles</h3>
            <p className="text-muted-foreground">
              Fresh content delivered daily. Stay up-to-date with the latest insights and trends.
            </p>
          </div>

          {/* Weekly Deep Dives */}
          <div className="text-center space-y-4 p-6 rounded-2xl border border-border hover:bg-accent/20 transition-all duration-300">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="text-accent-foreground" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Weekly Deep Dives</h3>
            <p className="text-muted-foreground">
              Comprehensive weekly articles for deeper understanding and analysis.
            </p>
          </div>

          {/* Multi-language */}
          <div className="text-center space-y-4 p-6 rounded-2xl border border-border hover:bg-accent/20 transition-all duration-300">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
              <Globe className="text-accent-foreground" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Multi-language</h3>
            <p className="text-muted-foreground">
              Content available in multiple languages with AI-powered summaries.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Join Thousands of Readers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-accent-foreground">1000+</div>
              <div className="text-muted-foreground">Articles</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-accent-foreground">50+</div>
              <div className="text-muted-foreground">Categories</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-accent-foreground">Daily</div>
              <div className="text-muted-foreground">Updates</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-accent-foreground">AI</div>
              <div className="text-muted-foreground">Summaries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-6 bg-accent/10 rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Ready to Start Reading?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover curated articles that matter. Join our community of informed readers today.
          </p>
          <Link href="/new">
            <button className="flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-full font-medium hover:bg-muted transition-all duration-300 hover:scale-105 mx-auto">
              <BookOpen size={20} />
              Explore Articles
              <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
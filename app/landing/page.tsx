import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Clock, Globe, Sparkles, Users, Zap, Shield, TrendingUp, Star, CheckCircle } from 'lucide-react'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Xarticle - Curated Articles from X',
  description: 'Discover high-quality articles automatically curated from X (Twitter). AI-powered summaries, multi-language support, and real-time updates.',
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get categories and stats
  const { data: categoriesData } = await supabase
    .from('articles')
    .select('category')
    .not('category', 'is', null)
  
  const categories = [...new Set(categoriesData?.map((item: { category: string }) => item.category).filter(Boolean) || [])] as string[]

  // Get real stats from database
  const { count: totalArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })

  const { count: todayArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('tag', 'Day')

  return (
    <div className="min-h-screen bg-background">
      <ClientNavWrapper initialUser={user} categories={categories} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center space-y-8">
            {/* Logo & Brand */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-4 group">
                <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center hover:bg-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-xl">
                  <span className="text-2xl font-black text-background">𝕏</span>
                </div>
                <div className="text-left">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                    Xarticle
                  </h1>
                  <p className="text-sm text-muted-foreground">Curated from X</p>
                </div>
              </div>
            </div>

            {/* Hero Text */}
            <div className="space-y-6">
              <h2 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
                The Best Articles
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  From X
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Automatically discover and curate high-quality articles shared on X. 
                <br className="hidden md:block" />
                AI-powered summaries, real-time updates, and multi-language support.
              </p>
            </div>

            {/* Feature Tags */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {['Real-time Updates', 'AI Summaries', 'Multi-language', 'No Ads'].map((feature) => (
                <span key={feature} className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {feature}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {user ? (
                <Link href="/new">
                  <Button size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <BookOpen className="mr-2" size={24} />
                    Continue Reading
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <Sparkles className="mr-2" size={24} />
                    Get Started Free
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
              )}
              
              <Link href="/new">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full border-2 hover:bg-accent/20 transition-all duration-300">
                  <Globe className="mr-2" size={24} />
                  Explore Articles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose Xarticle?
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The smartest way to discover and consume quality content from X
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Auto Curation */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Zap className="text-primary-foreground" size={32} />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Auto Curation</h4>
              <p className="text-muted-foreground leading-relaxed">
                Our AI automatically identifies and curates the best articles shared on X, saving you hours of scrolling.
              </p>
            </CardContent>
          </Card>

          {/* Real-time Updates */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Clock className="text-primary-foreground" size={32} />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Real-time Updates</h4>
              <p className="text-muted-foreground leading-relaxed">
                Get the latest articles as they're shared. Fresh content delivered every 15 minutes, 24/7.
              </p>
            </CardContent>
          </Card>

          {/* AI Summaries */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="text-primary-foreground" size={32} />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">AI Summaries</h4>
              <p className="text-muted-foreground leading-relaxed">
                Get instant AI-generated summaries in multiple languages. Understand key points before diving deep.
              </p>
            </CardContent>
          </Card>

          {/* Multi-language Support */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Globe className="text-primary-foreground" size={32} />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Global Content</h4>
              <p className="text-muted-foreground leading-relaxed">
                Access articles in multiple languages with automatic translation and localized summaries.
              </p>
            </CardContent>
          </Card>

          {/* Quality Filter */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Shield className="text-primary-foreground" size={32} />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Quality First</h4>
              <p className="text-muted-foreground leading-relaxed">
                Advanced filtering ensures only high-quality, substantial articles make it to your feed.
              </p>
            </CardContent>
          </Card>

          {/* Engagement Metrics */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="text-primary-foreground" size={32} />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Rich Metrics</h4>
              <p className="text-muted-foreground leading-relaxed">
                See engagement data, view counts, and social metrics to discover trending content.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-12">
            <div className="space-y-4">
              <h3 className="text-4xl md:text-5xl font-bold text-foreground">
                Powered by Real Data
              </h3>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Live statistics from our growing platform
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-3">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {totalArticles?.toLocaleString() || '2,500+'}
                </div>
                <div className="text-muted-foreground font-medium">Total Articles</div>
              </div>
              <div className="space-y-3">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  {todayArticles || '47'}
                </div>
                <div className="text-muted-foreground font-medium">Today's Articles</div>
              </div>
              <div className="space-y-3">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {categories.length}+
                </div>
                <div className="text-muted-foreground font-medium">Categories</div>
              </div>
              <div className="space-y-3">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-muted-foreground font-medium">Auto Updates</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple, automated, and intelligent article discovery
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto shadow-lg">
              <span className="text-2xl font-bold text-primary-foreground">1</span>
            </div>
            <h4 className="text-2xl font-bold text-foreground">Automated Discovery</h4>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Our system continuously monitors curated X accounts and automatically identifies high-quality articles.
            </p>
          </div>

          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mx-auto shadow-lg">
              <span className="text-2xl font-bold text-primary-foreground">2</span>
            </div>
            <h4 className="text-2xl font-bold text-foreground">AI Processing</h4>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Each article is processed by AI to extract key information, generate summaries, and provide translations.
            </p>
          </div>

          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto shadow-lg">
              <span className="text-2xl font-bold text-primary-foreground">3</span>
            </div>
            <h4 className="text-2xl font-bold text-foreground">Personalized Feed</h4>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Get a clean, organized feed with categories, filters, and engagement metrics to find what matters to you.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h3 className="text-4xl md:text-5xl font-bold text-foreground">
                Why Readers Love Xarticle
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="text-primary mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="text-xl font-semibold text-foreground mb-2">No Algorithm Manipulation</h4>
                    <p className="text-muted-foreground">Pure chronological feeds based on publication time, not engagement algorithms.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <CheckCircle className="text-primary mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="text-xl font-semibold text-foreground mb-2">Ad-Free Experience</h4>
                    <p className="text-muted-foreground">Focus on content without distractions. Clean, minimal interface designed for reading.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <CheckCircle className="text-primary mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="text-xl font-semibold text-foreground mb-2">Smart Categorization</h4>
                    <p className="text-muted-foreground">Automatic tagging and categorization helps you find articles by topic and timeframe.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <CheckCircle className="text-primary mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="text-xl font-semibold text-foreground mb-2">Global Accessibility</h4>
                    <p className="text-muted-foreground">Multi-language support with AI translations makes content accessible to everyone.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:pl-12">
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <Star className="text-primary mx-auto" size={48} />
                    <h4 className="text-2xl font-bold text-foreground">Join Our Community</h4>
                    <p className="text-muted-foreground text-lg">
                      Thousands of readers trust Xarticle to stay informed with quality content.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6 mt-8">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{totalArticles?.toLocaleString() || '2,500+'}</div>
                        <div className="text-muted-foreground text-sm">Articles Curated</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-accent">15min</div>
                        <div className="text-muted-foreground text-sm">Update Frequency</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore by Category
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover articles across diverse topics and interests
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.slice(0, 12).map((category) => (
            <Link key={category} href={`/new?category=${encodeURIComponent(category)}`}>
              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <h5 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category}
                  </h5>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-primary via-accent to-primary py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h3 className="text-4xl md:text-5xl font-bold text-primary-foreground">
            Ready to Transform Your Reading?
          </h3>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Join thousands of informed readers who trust Xarticle for their daily dose of quality content.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {user ? (
              <Link href="/new">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <BookOpen className="mr-2" size={24} />
                  Go to Articles
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <Users className="mr-2" size={24} />
                    Sign In
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
                
                <Link href="/register">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-all duration-300">
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                  <span className="text-sm font-black text-background">𝕏</span>
                </div>
                <span className="text-lg font-bold text-foreground">Xarticle</span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Discover quality articles from X, powered by AI.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2024 Xarticle. Built with Next.js and Supabase.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
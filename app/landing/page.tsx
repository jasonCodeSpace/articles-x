import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen, Globe, Sparkles, Users, Shield, TrendingUp, Star, CheckCircle, Eye, Heart, Bookmark } from 'lucide-react'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { generateCategorySlug } from '@/lib/url-utils'

export const metadata: Metadata = {
  title: 'Xarticle — The Best Articles from X, Curated and Summarized',
  description: 'Discover the most valuable long-form articles shared on X. Read crisp summaries, browse by topic or account, and save your personal must-read list.',
  alternates: {
    canonical: '/landing'
  },
  openGraph: {
    title: 'Xarticle — The Best Articles from X, Curated and Summarized',
    description: 'Discover the most valuable long-form articles shared on X. Read crisp summaries, browse by topic or account, and save your personal must-read list.',
    url: '/landing',
    siteName: 'Xarticle',
    type: 'website',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Xarticle - Curated Articles from X'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xarticle — The Best Articles from X, Curated and Summarized',
    description: 'Discover the most valuable long-form articles shared on X. Read crisp summaries, browse by topic or account, and save your personal must-read list.',
    images: ['/logo.svg']
  }
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Use standardized categories only
  const categories = [
    'Hardware',
    'Gaming',
    'Health',
    'Environment',
    'Personal Story',

    'Culture',
    'Philosophy',
    'History',
    'Education',
    'Design',
    'Marketing',
    'AI',
    'Crypto',
    'Tech',
    'Data',
    'Startups',
    'Business',
    'Markets',
    'Product',
    'Security',
    'Policy',
    'Science',
    'Media'
  ]

  // Get real stats from database (all articles)
  const { count: totalArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })

  // Get top 3 trending articles for hero section (English only)
  const { data: trendingArticles } = await supabase
    .from('articles')
    .select(`
      *,
      summary_chinese,
      summary_english,
      summary_generated_at
    `)
    .eq('language', 'en')
    .in('tag', ['Day', 'Week'])
    .not('summary_english', 'is', null)
    .neq('summary_english', '')
    .order('tweet_views', { ascending: false })
    .limit(3)

  // Get today's articles count (currently unused)
  // const { count: todayArticles } = await supabase
  //   .from('articles')
  //   .select('*', { count: 'exact', head: true })
  //   .eq('tag', 'Day')

  return (
    <div className="min-h-screen bg-background">
      <ClientNavWrapper initialUser={user} categories={categories} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/15"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Hero Content */}
            <div className="text-center lg:text-left space-y-8">
              {/* Logo & Brand */}
              <div className="flex justify-center lg:justify-start mb-8">
                <div className="flex items-center gap-4 group">
                  <div className="w-16 h-16 flex items-center justify-center hover:opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-xl">
                    <Image src="/logo.svg" alt="Xarticle Logo" width={64} height={64} className="w-16 h-16" />
                  </div>
                  <div className="text-left">
                    <div className="text-4xl font-bold text-foreground">
                      Xarticle
                    </div>

                  </div>
                </div>
              </div>

              {/* Hero Text */}
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight text-balance">
                  The best articles from X —
                  <br />
                  <span className="gradient-text">
                    curated for you
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed text-balance">
                  Discover high-quality long-form content with AI-powered summaries, smart categorization, and personalized reading lists.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/trending">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    Explore Articles
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
                
                <Link href="/login">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full border-2 hover:bg-accent/20 transition-all duration-300 hover-lift">
                    Start Reading
                  </Button>
                </Link>
              </div>
              

            </div>

            {/* Right Column - Article Preview Cards */}
            <div className="space-y-4">
              <div className="space-y-4">
                {trendingArticles?.slice(0, 3).map((article) => (
                  <Card key={article.id} className="group card-enhanced hover-lift cursor-pointer relative overflow-hidden">
                    {/* Background Image */}
                    {article.image && (
                      <div className="absolute inset-0 opacity-10">
                        <Image 
                          src={article.image} 
                          alt={`Background image for ${article.title}`} 
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-6 relative z-10">
                      <div className="space-y-4">
                        {/* Article Title */}
                        <h4 className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h4>
                        
                        {/* Quick Actions */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div>
                              by {article.author_handle || 'unknown'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye size={12} />
                              <span>{article.tweet_views?.toLocaleString() || '0'}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Link href={`/article/${article.slug}`}>
                              <Button size="sm" variant="outline" className="text-xs px-3 py-1 h-7">
                                Read Article
                              </Button>
                            </Link>

                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  // Fallback placeholder cards if no articles
                  Array.from({ length: 3 }, (_, index) => (
                    <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border hover:border-primary/20 cursor-pointer">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground font-medium">
                            {['techcrunch.com', 'medium.com', 'substack.com'][index]}
                          </div>
                          <h4 className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                            {[
                              'Frontier AI: Why scaling still matters',
                              'Markets at a glance: What moved this week',
                              'Designing for speed without breaking trust'
                            ][index]}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            AI-generated summary helps you understand the key points before diving into the full article...
                          </p>
                          <div className="flex items-center justify-between pt-2">
                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                              {['AI', 'Markets', 'Design'][index]}
                            </span>
                            
                            {/* Placeholder Stats */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye size={12} />
                                <span>{[245, 189, 367][index]}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart size={12} />
                                <span>{[23, 15, 41][index]}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Bookmark size={12} />
                                <span>{[12, 8, 19][index]}</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why readers choose Xarticle
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Signal over noise */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Shield className="text-primary-foreground" size={32} />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Signal over noise</h4>
              <p className="text-muted-foreground leading-relaxed">
                Only substantial long-form articles make it through our curation process.
              </p>
            </CardContent>
          </Card>

          {/* Quick understanding */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="text-primary-foreground" size={32} />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Quick understanding</h4>
              <p className="text-muted-foreground leading-relaxed">
                Crisp summaries help you triage content fast and decide what to read now.
              </p>
            </CardContent>
          </Card>

          {/* Power discovery */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="text-primary-foreground" size={32} />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Power discovery</h4>
              <p className="text-muted-foreground leading-relaxed">
                Browse by category, account, or trending themes to find exactly what you need.
              </p>
            </CardContent>
          </Card>

          {/* Source context */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="text-primary-foreground" size={32} />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Source context</h4>
              <p className="text-muted-foreground leading-relaxed">
                See who shared each article and basic engagement metrics for better context.
              </p>
            </CardContent>
          </Card>

          {/* Personal library */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="text-primary-foreground" size={32} />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Personal library</h4>
              <p className="text-muted-foreground leading-relaxed">
                Save, tag, and revisit your must-reads with a simple personal library system.
              </p>
            </CardContent>
          </Card>

          {/* Global view */}
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Globe className="text-primary-foreground" size={32} />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Global view</h4>
              <p className="text-muted-foreground leading-relaxed">
                Summaries available in multiple languages to break down language barriers.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>



      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Trending Topics
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest conversations and trending discussions from X
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
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Subscribe or Follow
              </h2>
              
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
                    
                    <div className="flex justify-center mt-8">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{totalArticles?.toLocaleString() || '2,500+'}</div>
                        <div className="text-muted-foreground text-sm">Articles Curated</div>
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
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore by Category
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover articles across diverse topics and interests
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.slice(0, 12).map((category) => (
            <Link key={category} href={`/category/${generateCategorySlug(category)}`}>
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

      {/* Social Proof */}


      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Questions, answered
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                How does Xarticle find articles?
              </h3>
              <p className="text-muted-foreground">
                We monitor thousands of X accounts from founders, VCs, researchers, and thought leaders. Our AI identifies when they share long-form articles and automatically curates the best content.
              </p>
            </div>
            
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Can I save articles for later?
              </h3>
              <p className="text-muted-foreground">
                Yes! Create your personal reading list by saving articles. Access your saved articles anytime from your dashboard.
              </p>
            </div>
            
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                How often is content updated?
              </h3>
              <p className="text-muted-foreground">
                Our system runs continuously, updating every 15 minutes to ensure you never miss the latest valuable content shared on X.
              </p>
            </div>
          </div>
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
              <Link href="/trending">
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
      <footer className="bg-background border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image src="/logo.svg" alt="Xarticle Logo" width={32} height={32} className="w-8 h-8" />
                <span className="text-lg font-bold text-foreground">Xarticle</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Xarticle turns X into a curated, article-first reading experience.
              </p>
              <div className="space-y-2 text-sm">
                <a href="mailto:hi@xarticle.news" className="block text-muted-foreground hover:text-foreground transition-colors">
                  hi@xarticle.news
                </a>
              </div>
            </div>
            
            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Product</h4>
              <div className="space-y-2 text-sm">
                <Link href="/landing" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Landing Page
                </Link>
                <Link href="/trending" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Trending
                </Link>
                <a href="https://www.xarticle.news/category/all" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Categories
                </a>
              </div>
            </div>
            
            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link href="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Privacy
                </Link>
              </div>
            </div>
            
            {/* Social */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Follow Us</h4>
              <div className="space-y-2 text-sm">
                <a 
                  href="https://x.com/0xJason65066" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Image src="/x-icon.svg" alt="X" width={16} height={16} className="w-4 h-4" />
                  Follow on X
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © Xarticle. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
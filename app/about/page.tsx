import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Newspaper, Target, Workflow, Shield, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'

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

  // Fetch categories for navigation
  let categories: string[] = [];
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null);

    if (!error && data) {
      const uniqueCategories = new Set<string>();
      data.forEach(article => {
        if (article.category) {
          const firstCategory = article.category.split(',')[0].trim();
          uniqueCategories.add(firstCategory);
        }
      });
      categories = Array.from(uniqueCategories).sort();
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNavWrapper initialUser={user} categories={categories} />

      <div className="pt-20 md:pt-16 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>

            <div className="mb-4">
              <h1 className="text-3xl font-bold tracking-tight">About Xarticle</h1>
              <p className="text-muted-foreground mt-2">
                Curating the best long-form content from X, powered by AI
              </p>
            </div>

            <div className="text-sm text-muted-foreground mb-8">
              Last updated: January 2025
            </div>
          </div>

          {/* Content Cards - continued in next section */}
          <div className="space-y-6">
            {/* Card 1: What is Xarticle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5" />
                  What is Xarticle?
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  Xarticle is a content curation platform that discovers, organizes, and summarizes high-quality long-form articles shared on X (formerly Twitter).
                </p>
                <p>
                  Every day, thousands of valuable articles are shared on X but get lost in the noise of social media. We solve this problem by curating quality content and making it easily discoverable.
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Our Mission */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p><strong>We don&apos;t just aggregate links — we add original value.</strong></p>
                <ul>
                  <li><strong>AI Summaries:</strong> Every article includes original bilingual summaries in English and Chinese</li>
                  <li><strong>Smart Curation:</strong> We filter signal from noise, focusing on substance over clickbait</li>
                  <li><strong>Easy Discovery:</strong> 20+ categories help you find topics you care about</li>
                </ul>
              </CardContent>
            </Card>

            {/* Card 3: How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="w-5 h-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <ol>
                  <li><strong>Discover:</strong> We monitor curated Twitter lists for quality articles</li>
                  <li><strong>Extract:</strong> Our system identifies articles with substantial long-form content</li>
                  <li><strong>Summarize:</strong> AI generates concise bilingual summaries</li>
                  <li><strong>Organize:</strong> Articles are categorized by topic (AI, Crypto, Tech, Business, etc.)</li>
                  <li><strong>Deliver:</strong> You get a clean reading experience, always linking to the original source</li>
                </ol>
              </CardContent>
            </Card>

            {/* Card 4: Our Commitment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Our Commitment
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <ul>
                  <li><strong>Respect Creators:</strong> We always link to original sources and authors</li>
                  <li><strong>Transparency:</strong> AI-generated summaries are clearly labeled</li>
                  <li><strong>Privacy First:</strong> We don&apos;t sell your data (see our <Link href="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">Privacy Policy</Link>)</li>
                  <li><strong>Quality Focus:</strong> Substance over clickbait</li>
                </ul>
              </CardContent>
            </Card>

            {/* Card 5: Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>Questions, feedback, or partnership inquiries?</p>
                <p>
                  <strong>Email:</strong> hi@xarticle.news<br />
                  <strong>Twitter:</strong> <a href="https://twitter.com/xarticle_news" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">@xarticle_news</a>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Footer Actions */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Thank you for using Xarticle
              </div>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/privacy">Privacy Policy</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/terms">Terms of Service</Link>
                </Button>
                <Button asChild>
                  <Link href="/">Return to Xarticle</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

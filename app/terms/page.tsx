import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, FileText, Users, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'

export const metadata: Metadata = {
  title: 'Terms of Service | Xarticle',
  description: 'Terms of Service for Xarticle - The best articles from X, curated and summarized.',
  robots: 'index, follow'
}

export default async function Terms() {
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
            <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                Welcome to Xarticle (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your use of our website 
                and services that curate and summarize articles shared on X (formerly Twitter).
              </p>
              <p>
                By accessing or using Xarticle, you agree to be bound by these Terms. If you disagree with any part of these 
                terms, then you may not access our service.
              </p>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card>
            <CardHeader>
              <CardTitle>Service Description</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>Xarticle provides the following services:</p>
              <ul>
                <li>Curation of long-form articles shared on X</li>
                <li>AI-powered article summaries and translations</li>
                <li>Categorization and organization of articles</li>
                <li>Personal bookmarking and reading lists</li>
                <li>Author and topic-based browsing</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <h4>Account Creation</h4>
              <p>
                To access certain features, you may need to create an account. You are responsible for:
              </p>
              <ul>
                <li>Providing accurate and complete information</li>
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us of any unauthorized use</li>
              </ul>

              <h4>Account Termination</h4>
              <p>
                We reserve the right to suspend or terminate accounts that violate these Terms or engage in harmful activities.
              </p>
            </CardContent>
          </Card>

          {/* Content and Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>Content and Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <h4>Third-Party Content</h4>
              <p>
                Articles and content on Xarticle are sourced from publicly available posts on X and external websites. 
                We respect intellectual property rights and provide proper attribution to original sources.
              </p>

              <h4>AI-Generated Content</h4>
              <p>
                Summaries and translations are generated using AI technology. While we strive for accuracy, these may not 
                perfectly represent the original content. Users should refer to original sources for complete information.
              </p>

              <h4>User-Generated Content</h4>
              <p>
                By using our service, you grant us a non-exclusive license to use, display, and distribute any content 
                you submit (such as bookmarks or comments) for the operation of our service.
              </p>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Acceptable Use
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>You agree not to use Xarticle to:</p>
              <ul>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Distribute harmful, offensive, or illegal content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use automated tools to scrape or harvest data</li>
                <li>Interfere with the proper functioning of our service</li>
              </ul>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy and Data</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                Your privacy is important to us. Please review our{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Privacy Policy
                </Link>{' '}
                to understand how we collect, use, and protect your information.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle>Disclaimers</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <h4>Service Availability</h4>
              <p>
                We strive to maintain service availability but cannot guarantee uninterrupted access. We may suspend 
                or modify our service for maintenance or improvements.
              </p>

              <h4>Content Accuracy</h4>
              <p>
                While we make efforts to provide accurate summaries and information, we do not warrant the completeness 
                or accuracy of content. Users should verify important information from original sources.
              </p>

              <h4>Third-Party Links</h4>
              <p>
                Our service contains links to external websites. We are not responsible for the content or practices 
                of these third-party sites.
              </p>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                To the fullest extent permitted by law, Xarticle shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred 
                directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of significant changes 
                via email or prominent notice on our website. Continued use of our service after changes constitutes 
                acceptance of the new Terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p>
                Email: hi@xarticle.news<br />
                Website: <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">www.xarticle.news</Link>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="text-sm text-muted-foreground">
              These terms are effective as of {new Date().toLocaleDateString()}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/privacy">View Privacy Policy</Link>
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

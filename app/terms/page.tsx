import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, FileText, Users, Globe, Lock, AlertTriangle, Mail } from 'lucide-react'
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
            <p className="text-muted-foreground mt-2">
              Please read these terms carefully before using our service
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground mb-8">
            Last updated: September 4, 2025
          </div>
        </div>

        {/* Terms Content */}
        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                Welcome to Xarticle (&quot;Xarticle&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your use of <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">https://www.xarticle.news/</Link> (the &quot;Service&quot;).
              </p>
              <p>
                By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, please do not use the Service.
              </p>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Service Description
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>Xarticle curates links to long-form articles shared on X and across the web, and provides AI-generated summaries and organization. Our Service includes:</p>
              
              <h4>Article Curation</h4>
              <p>We collect and organize links to publicly available articles from X and other sources.</p>

              <h4>AI Summaries and Translation</h4>
              <p>We provide AI-generated summaries and translations to help you understand content quickly.</p>

              <h4>Categorization and Organization</h4>
              <p>Articles are automatically categorized by topics for easier discovery.</p>

              <h4>User Features</h4>
              <p>Registered users can bookmark articles, create reading lists, and customize preferences.</p>
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
              <p>To access certain features, you may create an account. You must provide accurate information and are responsible for maintaining account security.</p>

              <h4>Account Termination</h4>
              <p>You may delete your account at any time. We may suspend or terminate accounts for violations of these Terms or harmful conduct.</p>
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
                We curate links to third-party articles and content. We do not claim ownership of this content and provide proper attribution and links to original sources.
              </p>

              <h4>AI-Generated Content</h4>
              <p>
                Our AI-generated summaries, translations, and categorizations are provided for informational purposes. We strive for accuracy but do not guarantee completeness or accuracy.
              </p>

              <h4>User Content</h4>
              <p>
                Content you submit (bookmarks, preferences) remains your property. By submitting content, you grant us a license to use it in connection with the Service.
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
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for illegal purposes or to violate any laws</li>
                <li>Infringe on intellectual property rights</li>
                <li>Distribute harmful, offensive, or inappropriate content</li>
                <li>Attempt unauthorized access to our systems</li>
                <li>Interfere with the Service&apos;s operation</li>
                <li>Use automated tools to scrape or download content</li>
                <li>Impersonate others or provide false information</li>
              </ul>
            </CardContent>
          </Card>

          {/* Third-Party Services and Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Third-Party Services and Links
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>Our Service contains links to third-party websites and services. We are not responsible for their content, privacy practices, or availability.</p>
            </CardContent>
          </Card>

          {/* Privacy */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Lock className="w-5 h-5" />
                 Privacy
               </CardTitle>
             </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                Your privacy is governed by our <Link href="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Privacy Policy</Link>, which is incorporated into these Terms.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimers and Limitation of Liability */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5" />
                 Disclaimers and Limitation of Liability
               </CardTitle>
             </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED.</p>
              <p>TO THE FULLEST EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                We may modify these Terms at any time. Changes will be posted on this page with an updated date. Continued use constitutes acceptance of new Terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Mail className="w-5 h-5" />
                 Contact Us
               </CardTitle>
             </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                Questions about these Terms? Contact us at <Link href="mailto:hi@xarticle.news" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">hi@xarticle.news</Link>
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

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, Database, Cookie, Mail, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'

export const metadata: Metadata = {
  title: 'Privacy Policy | Xarticle',
  description: 'Privacy Policy for Xarticle - Learn how we protect and handle your personal information.',
  robots: 'index, follow'
}

export default async function Privacy() {
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
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                At Xarticle (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we respect your privacy and are committed to protecting your personal 
                information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our website and services.
              </p>
              <p>
                Please read this Privacy Policy carefully. By using Xarticle, you consent to the practices described in this policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <h4>Personal Information</h4>
              <p>We may collect the following personal information:</p>
              <ul>
                <li><strong>Account Information:</strong> Email address, username, and authentication data</li>
                <li><strong>Profile Information:</strong> Display name, preferences, and settings</li>
                <li><strong>Usage Data:</strong> Articles you bookmark, categories you browse, and reading history</li>
              </ul>

              <h4>Automatically Collected Information</h4>
              <ul>
                <li><strong>Technical Data:</strong> IP address, browser type, device information, and operating system</li>
                <li><strong>Analytics Data:</strong> Page views, session duration, and user interactions</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies, preference cookies, and analytics cookies</li>
              </ul>

              <h4>Third-Party Content</h4>
              <p>
                We collect publicly available information from X (Twitter) and external websites to curate articles. 
                This includes article titles, content, author information, and publication dates.
              </p>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>We use your information for the following purposes:</p>
              
              <h4>Service Provision</h4>
              <ul>
                <li>Provide and maintain our article curation service</li>
                <li>Personalize your experience and content recommendations</li>
                <li>Save your bookmarks and reading preferences</li>
                <li>Enable account authentication and security</li>
              </ul>

              <h4>Communication</h4>
              <ul>
                <li>Send service-related notifications and updates</li>
                <li>Respond to your inquiries and support requests</li>
                <li>Provide information about new features (with your consent)</li>
              </ul>

              <h4>Analytics and Improvement</h4>
              <ul>
                <li>Analyze usage patterns to improve our service</li>
                <li>Monitor and analyze trends and user behavior</li>
                <li>Conduct research and development for new features</li>
              </ul>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle>Information Sharing and Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>We do not sell, trade, or rent your personal information. We may share information in the following circumstances:</p>

              <h4>Service Providers</h4>
              <p>
                We work with trusted third-party service providers who assist us in operating our service, including:
              </p>
              <ul>
                <li>Cloud hosting and infrastructure providers</li>
                <li>Analytics and monitoring services</li>
                <li>Email delivery services</li>
                <li>AI and machine learning services for content processing</li>
              </ul>

              <h4>Legal Requirements</h4>
              <p>We may disclose information when required by law or to:</p>
              <ul>
                <li>Comply with legal obligations or court orders</li>
                <li>Protect our rights, property, or safety</li>
                <li>Investigate potential violations of our Terms of Service</li>
                <li>Protect against fraud or security threats</li>
              </ul>

              <h4>Business Transfers</h4>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part 
                of the business transaction.
              </p>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="w-5 h-5" />
                Cookies and Tracking Technologies
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <h4>Types of Cookies We Use</h4>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for basic site functionality and authentication</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
                <li><strong>Performance Cookies:</strong> Monitor and improve site performance</li>
              </ul>

              <h4>Managing Cookies</h4>
              <p>
                You can control cookies through your browser settings. However, disabling certain cookies may affect 
                the functionality of our service.
              </p>

              <h4>Third-Party Analytics</h4>
              <p>
                We use analytics services like Google Analytics to understand user behavior. These services may 
                collect information about your use of our site and other websites.
              </p>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>We implement appropriate security measures to protect your information:</p>
              <ul>
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and monitoring</li>
                <li>Limited access to personal information on a need-to-know basis</li>
                <li>Secure cloud infrastructure with reputable providers</li>
              </ul>
              
              <p>
                While we strive to protect your information, no method of transmission over the internet is 100% secure. 
                We cannot guarantee absolute security but are committed to protecting your data.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>We retain your information for as long as necessary to:</p>
              <ul>
                <li>Provide our services to you</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Improve our services through analytics</li>
              </ul>
              
              <p>
                When you delete your account, we will delete or anonymize your personal information, except where 
                we are required to retain it for legal purposes.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights and Choices */}
          <Card>
            <CardHeader>
              <CardTitle>Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>You have the following rights regarding your personal information:</p>
              
              <h4>Access and Correction</h4>
              <ul>
                <li>Access your personal information we hold</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Update your account settings and preferences</li>
              </ul>

              <h4>Data Portability and Deletion</h4>
              <ul>
                <li>Request a copy of your data in a portable format</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of certain data processing activities</li>
              </ul>

              <h4>Communication Preferences</h4>
              <ul>
                <li>Unsubscribe from marketing communications</li>
                <li>Manage notification settings</li>
                <li>Control cookie preferences</li>
              </ul>
            </CardContent>
          </Card>

          {/* International Data Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                International Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. 
                We ensure that such transfers comply with applicable data protection laws and implement appropriate 
                safeguards to protect your information.
              </p>
            </CardContent>
          </Card>

          {/* Children&apos;s Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children&apos;s Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If we become aware that we have collected information from a child 
                under 13, we will take steps to delete such information.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul>
                <li>Posting the updated policy on our website</li>
                <li>Sending you an email notification</li>
                <li>Displaying a prominent notice on our service</li>
              </ul>
              <p>
                Your continued use of our service after the effective date of the revised Privacy Policy constitutes 
                acceptance of the changes.
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
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <p>
                <strong>Email:</strong> hi@xarticle.news<br />
                <strong>Website:</strong> <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">www.xarticle.news</Link><br />
                <strong>Subject Line:</strong> Privacy Policy Inquiry
              </p>
              <p>
                We will respond to your inquiry within 2 days of receipt.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="text-sm text-muted-foreground">
              This policy is effective as of {new Date().toLocaleDateString()}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/terms">View Terms of Service</Link>
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

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

  return (
    <div className="min-h-screen bg-background">
      <ClientNavWrapper initialUser={user} />
      
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
            <p className="text-muted-foreground mt-2">
              Learn how we protect and handle your personal information
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground mb-8">
            Last updated: January 16, 2025
          </div>
        </div>

        {/* Privacy Policy Content */}
        <div className="space-y-6">
          {/* Who We Are */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Who We Are
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                Xarticle (&quot;Xarticle&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a website that curates links to long-form articles shared on X and across the web, and provides AI-generated summaries and organization. Xarticle is operated by an individual (the &quot;Operator&quot;). You can contact us at hi@xarticle.news.
              </p>
              <p>
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">https://www.xarticle.news/</Link> (the &quot;Service&quot;). By using the Service, you agree to the practices described here.
              </p>
              <h4>Scope</h4>
              <p>
                This Policy applies to the Service and related web features. It does not apply to third-party websites that we link to or embed.
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
              <h4>1) Information You Provide</h4>
              <p><strong>Account Information:</strong> email address, authentication data.</p>
              <p><strong>Profile/Preferences:</strong> display name, reading settings.</p>
              <p><strong>Bookmarks/Lists:</strong> articles you save or organize.</p>

              <h4>2) Information Collected Automatically</h4>
              <p><strong>Technical Data:</strong> IP address, browser type, device/OS, referring URL, pages viewed, time spent, and similar diagnostics.</p>
              <p><strong>Cookies and Similar Technologies:</strong> essential cookies (authentication, security), preference cookies (e.g., language), and analytics/performance cookies.</p>

              <h4>3) Public/Third-Party Sources</h4>
              <p><strong>Public Content:</strong> We collect and curate publicly available information from X and other sites (e.g., titles, snippets, author, publication date, article URLs and metadata) strictly for curation, summarization, and navigation purposes.</p>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                How We Use Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p><strong>Provide the Service:</strong> operate, maintain, and secure core features (authentication, bookmarks, preferences).</p>
              <p><strong>Personalize & Improve:</strong> remember your settings; measure usage to improve performance, relevance, and reliability.</p>
              <p><strong>Communications:</strong> send service notices (e.g., policy updates, account alerts) and respond to inquiries.</p>
              <p><strong>Safety & Compliance:</strong> detect and prevent abuse, fraud, and security incidents; comply with legal obligations.</p>
            </CardContent>
          </Card>

          {/* Legal Bases */}
          <Card>
            <CardHeader>
              <CardTitle>Our Legal Bases (EEA/UK where applicable)</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p><strong>Contractual Necessity:</strong> to create and maintain your account and provide core features.</p>
              <p><strong>Legitimate Interests:</strong> to secure and improve the Service; to curate publicly available content from X; to measure performance. We balance these interests against your rights and expectations.</p>
              <p><strong>Consent:</strong> for non-essential cookies/analytics and optional communications. You can withdraw consent at any time via cookie settings or unsubscribe links.</p>
              <p><strong>Legal Obligation:</strong> to comply with applicable laws and enforce our terms.</p>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="w-5 h-5" />
                Cookies and Similar Technologies
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>We use:</p>
              <ul>
                <li><strong>Essential Cookies</strong> (required for authentication and core functionality),</li>
                <li><strong>Preference Cookies</strong> (remember your settings), and</li>
                <li><strong>Analytics/Performance Cookies</strong> (under your consent where required).</li>
              </ul>
              <p><strong>Managing Cookies:</strong> You can control cookies in your browser. If we provide a Cookie Settings link in the footer, you can change non-essential cookie preferences or withdraw consent at any time. Disabling certain cookies may affect functionality.</p>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                We use analytics (e.g., Google Analytics) to understand usage and improve the Service. Where available, we enable IP anonymization and disable data sharing with advertising products. You can opt out via browser controls and the Google Analytics Opt-Out Add-On. See your browser&apos;s help pages for managing tracking technologies.
              </p>
            </CardContent>
          </Card>

          {/* AI and Profiling */}
          <Card>
            <CardHeader>
              <CardTitle>AI, Summaries, and Profiling</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                We use machine learning to summarize, classify, and organize content. We do not make decisions that produce legal or similarly significant effects solely based on automated processing. Where applicable, you may object to profiling used for analytics or personalization.
              </p>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Information Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p><strong>We do not sell your personal information.</strong></p>
              
              <h4>Service Providers</h4>
              <p>We work with trusted third-party providers (hosting, analytics, email delivery, AI/ML services) under strict data processing agreements.</p>

              <h4>Legal Requirements</h4>
              <p>We may disclose information when required by law, to protect rights/safety, investigate violations, or prevent fraud.</p>

              <h4>Business Transfers</h4>
              <p>In the event of a merger, acquisition, or sale, your information may be transferred with advance notice.</p>
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
              <p>We implement appropriate security measures:</p>
              <ul>
                <li>Encryption in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security monitoring</li>
                <li>Limited access on a need-to-know basis</li>
              </ul>
              <p>While we strive to protect your information, no internet transmission is 100% secure. We cannot guarantee absolute security but are committed to protecting your data.</p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>We retain information as long as necessary to provide the Service, comply with legal obligations, resolve disputes, and improve our services. When you delete your account, we delete or anonymize your personal information (except where legally required to retain it).</p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>Depending on your location, you may have rights to:</p>
              <ul>
                <li><strong>Access, Correct, Delete:</strong> your personal information</li>
                <li><strong>Data Portability:</strong> receive a copy in a structured format</li>
                <li><strong>Object/Restrict:</strong> certain processing activities</li>
                <li><strong>Withdraw Consent:</strong> where processing is based on consent</li>
              </ul>
              <p>To exercise these rights, contact us at hi@xarticle.news. We&apos;ll respond within a reasonable timeframe per applicable law.</p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                International Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>Your information may be processed in countries other than your residence. We ensure appropriate safeguards are in place to protect your information per applicable data protection laws.</p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children&apos;s Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>Our Service is not intended for children under 13. We do not knowingly collect information from children under 13. If we discover such collection, we will delete the information promptly.</p>
            </CardContent>
          </Card>

          {/* Changes to Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>We may update this Policy from time to time. We&apos;ll notify you of material changes by posting the updated policy, sending email notifications, or displaying prominent notices. Continued use after changes constitutes acceptance.</p>
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
              <p>If you have questions about this Privacy Policy, please contact us:</p>
              <p>
                <strong>X (Twitter):</strong> <a href="https://x.com/0xJason65066" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">@0xJason65066</a> (DM)<br />
                <strong>Email:</strong> hi@xarticle.news<br />
                <strong>Website:</strong> <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">https://www.xarticle.news/</Link>
              </p>
              <p>We typically respond right away.</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="text-sm text-muted-foreground">
              This policy is effective as of January 16, 2025
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

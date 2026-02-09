import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'

export const metadata: Metadata = {
  title: 'Privacy Policy | Xarticle',
  description: 'Privacy Policy for Xarticle - Learn how we protect and handle your personal information.',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://www.xarticle.news/privacy'
  }
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <ClientNavWrapper />

      <div className="pt-20 md:pt-16 pb-20">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <Link href="/" className="inline-flex items-center text-sm text-white/40 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>

            <h1 className="text-3xl font-bold tracking-tight mb-3">Privacy Policy</h1>
            <p className="text-white/50">
              Learn how we protect and handle your personal information
            </p>
            <p className="text-sm text-white/30 mt-4">
              Last updated: January 16, 2025
            </p>
          </div>

          {/* Privacy Policy Content */}
          <div className="space-y-10 text-white/70">
            {/* Who We Are */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Who We Are</h2>
              <p className="mb-3 text-sm leading-relaxed">
                Xarticle (&quot;Xarticle&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a website that curates links to long-form articles shared on X and across the web, and provides AI-generated summaries and organization.
              </p>
              <p className="mb-3 text-sm leading-relaxed">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use <Link href="/" className="text-white underline">Xarticle website</Link> (the &quot;Service&quot;).
              </p>
              <p className="text-sm leading-relaxed">
                This Policy applies to the Service and related web features. It does not apply to third-party websites that we link to or embed.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Information We Collect</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <h3 className="font-medium text-white mb-1">1) Information You Provide</h3>
                  <p className="text-white/60">Account Information: email address, authentication data.</p>
                  <p className="text-white/60">Profile/Preferences: display name, reading settings.</p>
                  <p className="text-white/60">Bookmarks/Lists: articles you save or organize.</p>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">2) Information Collected Automatically</h3>
                  <p className="text-white/60">Technical Data: IP address, browser type, device/OS, referring URL, pages viewed.</p>
                  <p className="text-white/60">Cookies: essential cookies (authentication), preference cookies, and analytics cookies.</p>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">3) Public/Third-Party Sources</h3>
                  <p className="text-white/60">We collect publicly available information from X and other sites for curation and summarization purposes.</p>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">How We Use Information</h2>
              <ul className="space-y-2 text-sm text-white/60">
                <li>• <span className="text-white/80">Provide the Service:</span> operate, maintain, and secure core features</li>
                <li>• <span className="text-white/80">Personalize & Improve:</span> remember your settings; measure usage to improve performance</li>
                <li>• <span className="text-white/80">Communications:</span> send service notices and respond to inquiries</li>
                <li>• <span className="text-white/80">Safety & Compliance:</span> detect and prevent abuse, fraud, and security incidents</li>
              </ul>
            </section>

            {/* Legal Bases */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Legal Bases (EEA/UK)</h2>
              <ul className="space-y-2 text-sm text-white/60">
                <li>• <span className="text-white/80">Contractual Necessity:</span> to create and maintain your account</li>
                <li>• <span className="text-white/80">Legitimate Interests:</span> to secure and improve the Service; to curate content</li>
                <li>• <span className="text-white/80">Consent:</span> for non-essential cookies/analytics (withdrawable anytime)</li>
                <li>• <span className="text-white/80">Legal Obligation:</span> to comply with applicable laws</li>
              </ul>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Cookies and Tracking</h2>
              <p className="text-sm text-white/60 mb-3">
                We use essential cookies (required for authentication), preference cookies (remember your settings), and analytics/performance cookies (under your consent where required).
              </p>
              <p className="text-sm text-white/60">
                You can control cookies in your browser. Disabling certain cookies may affect functionality.
              </p>
            </section>

            {/* Analytics */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Analytics</h2>
              <p className="text-sm text-white/60">
                We use analytics (e.g., Google Analytics) to understand usage and improve the Service. We enable IP anonymization and disable data sharing with advertising products where available.
              </p>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Information Sharing</h2>
              <p className="text-sm text-white/80 font-medium mb-2">We do not sell your personal information.</p>
              <ul className="space-y-2 text-sm text-white/60">
                <li>• <span className="text-white/80">Service Providers:</span> trusted third-party providers under strict data processing agreements</li>
                <li>• <span className="text-white/80">Legal Requirements:</span> when required by law, to protect rights/safety</li>
                <li>• <span className="text-white/80">Business Transfers:</span> in the event of a merger, acquisition, or sale</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Data Security</h2>
              <ul className="space-y-1 text-sm text-white/60">
                <li>• Encryption in transit and at rest</li>
                <li>• Secure authentication and access controls</li>
                <li>• Regular security monitoring</li>
                <li>• Limited access on a need-to-know basis</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Your Rights and Choices</h2>
              <p className="text-sm text-white/60 mb-3">Depending on your location, you may have rights to:</p>
              <ul className="space-y-1 text-sm text-white/60">
                <li>• Access, Correct, Delete your personal information</li>
                <li>• Data Portability: receive a copy in a structured format</li>
                <li>• Object/Restrict certain processing activities</li>
                <li>• Withdraw Consent where processing is based on consent</li>
              </ul>
              <p className="text-sm text-white/60 mt-3">
                Contact us at hi@xarticle.news to exercise these rights.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Contact Us</h2>
              <p className="text-sm text-white/60">
                Questions about this Privacy Policy?<br />
                <a href="https://x.com/0xJason65066" target="_blank" rel="noopener noreferrer" className="text-white underline">@0xJason65066</a> (DM)<br />
                hi@xarticle.news
              </p>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <span className="text-sm text-white/30">Effective as of January 16, 2025</span>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/terms">View Terms</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/">Back to Xarticle</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

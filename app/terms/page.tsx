import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'

export const metadata: Metadata = {
  title: 'Terms of Service | Xarticle',
  description: 'Terms of Service for Xarticle - The best articles from X, curated and summarized.',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://www.xarticle.news/terms'
  }
}

export default function TermsPage() {
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

            <h1 className="text-3xl font-bold tracking-tight mb-3">Terms of Service</h1>
            <p className="text-white/50">
              Please read these terms carefully before using our service
            </p>
            <p className="text-sm text-white/30 mt-4">
              Last updated: January 16, 2025
            </p>
          </div>

          {/* Terms Content */}
          <div className="space-y-10 text-white/70">
            {/* Introduction */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Introduction</h2>
              <p className="text-sm leading-relaxed mb-3">
                Welcome to Xarticle (&quot;Xarticle&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your use of <Link href="/" className="text-white underline">Xarticle website</Link> (the &quot;Service&quot;).
              </p>
              <p className="text-sm leading-relaxed">
                By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, please do not use the Service.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Service Description</h2>
              <p className="text-sm leading-relaxed mb-3">
                Xarticle curates links to long-form articles shared on X and provides AI-generated summaries and organization.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li>• <span className="text-white/80">Article Curation:</span> We collect and organize links to publicly available articles</li>
                <li>• <span className="text-white/80">AI Summaries:</span> We provide AI-generated summaries to help you understand content</li>
                <li>• <span className="text-white/80">Categorization:</span> Articles are organized by topics for easier discovery</li>
                <li>• <span className="text-white/80">User Features:</span> Registered users can bookmark articles and customize preferences</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">User Accounts</h2>
              <p className="text-sm leading-relaxed mb-2">
                <span className="text-white/80">Account Creation:</span> To access certain features, you may create an account. You must provide accurate information and are responsible for maintaining account security.
              </p>
              <p className="text-sm leading-relaxed">
                <span className="text-white/80">Account Termination:</span> You may delete your account at any time. We may suspend or terminate accounts for violations of these Terms.
              </p>
            </section>

            {/* Content and Intellectual Property */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Content and Intellectual Property</h2>
              <p className="text-sm leading-relaxed mb-2">
                <span className="text-white/80">Third-Party Content:</span> We curate links to third-party articles. We do not claim ownership and provide proper attribution.
              </p>
              <p className="text-sm leading-relaxed mb-2">
                <span className="text-white/80">AI-Generated Content:</span> Our AI summaries are provided for informational purposes. We strive for accuracy but do not guarantee completeness.
              </p>
              <p className="text-sm leading-relaxed">
                <span className="text-white/80">User Content:</span> Content you submit remains your property. By submitting, you grant us a license to use it in connection with the Service.
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Acceptable Use</h2>
              <p className="text-sm mb-3">You agree not to:</p>
              <ul className="space-y-1 text-sm text-white/60">
                <li>• Use the Service for illegal purposes</li>
                <li>• Infringe on intellectual property rights</li>
                <li>• Distribute harmful or inappropriate content</li>
                <li>• Attempt unauthorized access to our systems</li>
                <li>• Interfere with the Service&apos;s operation</li>
                <li>• Use automated tools to scrape content</li>
                <li>• Impersonate others or provide false information</li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Third-Party Services</h2>
              <p className="text-sm leading-relaxed">
                Our Service contains links to third-party websites. We are not responsible for their content, privacy practices, or availability.
              </p>
            </section>

            {/* Privacy */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Privacy</h2>
              <p className="text-sm leading-relaxed">
                Your privacy is governed by our <Link href="/privacy" className="text-white underline">Privacy Policy</Link>, which is incorporated into these Terms.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Disclaimers and Limitation of Liability</h2>
              <p className="text-sm leading-relaxed mb-2">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND.
              </p>
              <p className="text-sm leading-relaxed">
                TO THE FULLEST EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Changes to Terms</h2>
              <p className="text-sm leading-relaxed">
                We may modify these Terms at any time. Changes will be posted on this page with an updated date. Continued use constitutes acceptance.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Contact Us</h2>
              <p className="text-sm text-white/60">
                Questions about these Terms?<br />
                <a href="https://x.com/0xJason65066" target="_blank" rel="noopener noreferrer" className="text-white underline">@0xJason65066</a> (DM)<br />
                <Link href="mailto:hi@xarticle.news" className="text-white underline">hi@xarticle.news</Link>
              </p>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <span className="text-sm text-white/30">Effective as of {new Date().toLocaleDateString()}</span>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/privacy">View Privacy Policy</Link>
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

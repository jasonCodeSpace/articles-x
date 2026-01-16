import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Users, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'

export const metadata: Metadata = {
  title: 'Contact | Xarticle',
  description: 'Get in touch with Xarticle. Send a DM on X for questions, feedback, or partnership inquiries.',
  robots: 'index, follow'
}

export default async function Contact() {
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
              <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
              <p className="text-muted-foreground mt-2">
                I&apos;d love to hear from you
              </p>
            </div>
          </div>

          {/* Content Cards */}
          <div className="space-y-6">
            {/* Card 1: Get in Touch */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Get in Touch
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>Have questions, feedback, or suggestions? Send me a DM on X:</p>
                <p>
                  <strong>X (Twitter):</strong>{' '}
                  <a
                    href="https://x.com/0xJason65066"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    @0xJason65066
                  </a>
                </p>
                <p>I typically respond right away.</p>
              </CardContent>
            </Card>

            {/* Card 2: For Content Creators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  For Content Creators
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>
                  If you&apos;re a content creator and have questions about how your content appears on Xarticle, please reach out via DM. I respect creators and am happy to address any concerns.
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Report an Issue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Report an Issue
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>Found a bug or technical issue? DM me on X with:</p>
                <ul>
                  <li>A description of the issue</li>
                  <li>Screenshot if possible</li>
                </ul>
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
                  <Link href="/about">About</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/privacy">Privacy Policy</Link>
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

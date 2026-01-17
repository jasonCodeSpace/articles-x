import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Server-side 404 page for proper SEO
// Search engines will receive a 404 status code
export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* 404 Icon */}
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground">404</span>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Page Not Found
              </h1>
              <p className="text-muted-foreground">
                Sorry, the page you are looking for does not exist or has been removed.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/trending">
                    <Search className="mr-2 h-4 w-4" />
                    Trending
                  </Link>
                </Button>

                <Button variant="outline" asChild className="flex-1">
                  <Link href="/about">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    About
                  </Link>
                </Button>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-sm text-muted-foreground">
              <p>If you believe this is an error, please <a href="mailto:hi@xarticle.news" className="underline hover:text-foreground">contact us</a>.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AuthSuccess() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push('/')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNCIgZmlsbC1ydWxlPSJub256ZXJvIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
      
      <div className="relative w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Welcome to Articles X!
          </h2>
          <p className="mt-3 text-gray-600 text-lg">
            You&apos;re successfully signed in
          </p>
        </div>
        
        {/* Success Card */}
        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl shadow-green-500/10">
          <CardHeader className="pb-6 text-center">
            <CardTitle className="text-xl text-gray-900 font-semibold flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Authentication Successful
            </CardTitle>
            <CardDescription className="text-gray-600">
              You&apos;re now ready to explore curated articles from Twitter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Message */}
            <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-green-800 mb-2">
                  🎉 You&apos;re all set!
                </p>
                <p className="text-xs text-green-700">
                  Redirecting you to the articles feed in a few seconds...
                </p>
              </div>
            </div>

            {/* Action Button */}
            <Button asChild className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200">
              <Link href="/">
                <span>Explore Articles Now</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            {/* Loading indicator */}
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
              <span className="text-sm text-gray-600">Loading your feed...</span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Welcome to Articles X - Discover the best articles from curated Twitter lists
          </p>
        </div>
      </div>
    </div>
  )
}
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function AuthCodeError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const getErrorMessage = () => {
    switch (error) {
      case 'access_denied':
        return {
          title: 'Authentication Failed',
          description: errorDescription || 'Access was denied. This usually means the magic link has expired or is invalid.',
          suggestion: 'Please request a new magic link to continue.'
        }
      case 'invalid_request':
        return {
          title: 'Invalid Request',
          description: 'The authentication request was invalid.',
          suggestion: 'Please try signing in again from the beginning.'
        }
      default:
        return {
          title: 'Authentication Error',
          description: errorDescription || 'An unexpected error occurred during authentication.',
          suggestion: 'Please try signing in again.'
        }
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNCIgZmlsbC1ydWxlPSJub256ZXJvIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
      
      <div className="relative w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {errorInfo.title}
          </h2>
        </div>
        
        {/* Error Card */}
        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl shadow-red-500/10">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl text-gray-900 font-semibold flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Something went wrong
            </CardTitle>
            <CardDescription className="text-gray-600">
              {errorInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Details */}
            <div className="rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 p-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {errorInfo.suggestion}
                  </p>
                  <p className="text-xs text-red-700 mt-2">
                    Magic links expire after 1 hour for security. If you're having trouble, try:
                  </p>
                  <ul className="text-xs text-red-700 mt-2 ml-4 list-disc">
                    <li>Check if the link in your email is complete</li>
                    <li>Make sure you're using the latest email</li>
                    <li>Clear your browser cache and try again</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button asChild className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                <Link href="/login">
                  <Mail className="h-4 w-4 mr-2" />
                  Request New Magic Link
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full h-12">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </div>

            {/* Error Code (for debugging) */}
            {(error || errorDescription) && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono">
                  {error && <p>Error: {error}</p>}
                  {errorDescription && <p>Description: {errorDescription}</p>}
                </div>
              </details>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            If you continue to have problems, please contact support
          </p>
        </div>
      </div>
    </div>
  )
}
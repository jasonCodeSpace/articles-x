'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mail, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function Login() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const validatedEmail = emailSchema.parse({ email })
      
      const { error } = await supabase.auth.signInWithOtp({
        email: validatedEmail.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for the magic link!')
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNCIgZmlsbC1ydWxlPSJub256ZXJvIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
      
      <div className="relative w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Welcome to Articles X
          </h2>
          <p className="mt-3 text-gray-600 text-lg">
            Discover curated articles from Twitter
          </p>
        </div>
        
        {/* Login Card */}
        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl shadow-blue-500/10">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl text-gray-900 font-semibold">Sign in with email</CardTitle>
            <CardDescription className="text-gray-600">
              We'll send you a secure magic link to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-11 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Sending magic link...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Send Magic Link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
              
              {/* Success Message */}
              {message && (
                <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-800">{message}</p>
                      <p className="text-xs text-green-700 mt-1">
                        The link will expire in 1 hour for security.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 p-4">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">{error}</p>
                      <p className="text-xs text-red-700 mt-1">
                        Please try again or contact support if the issue persists.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
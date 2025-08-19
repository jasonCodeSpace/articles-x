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
        setError(err.issues[0].message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-900 to-black opacity-80"></div>
      
      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <Card className="backdrop-blur-xl bg-gray-800/90 border border-gray-700/50 shadow-2xl shadow-blue-500/10 rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-black">X</span>
                </div>
                <h1 className="text-3xl font-bold text-white">Xarticle</h1>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">
                Create your Xarticle account
              </h2>
              <p className="text-gray-300 text-base mb-6">
                Read the best articles from X — noise-free.
              </p>
              
              {/* Features */}
              <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-8">
                <span>No bots</span>
                <span>Curated</span>
                <span>Bilingual EN / 中文</span>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-12 h-14 bg-gray-700/50 border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-xl text-white placeholder-gray-400 text-base"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 text-base" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Sending magic link...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Send magic link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
              
              {/* Success Message */}
              {message && (
                <div className="rounded-xl bg-green-900/30 border border-green-700/50 p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-300">{message}</p>
                      <p className="text-xs text-green-400 mt-1">
                        The link will expire in 1 hour for security.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-900/30 border border-red-700/50 p-4">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-300">{error}</p>
                      <p className="text-xs text-red-400 mt-1">
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
            <div className="text-center mt-8">
              <p className="text-xs text-gray-400">
                By signing up, you agree to our{' '}
                 <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                   Terms of Service
                 </a>{' '}
                 •{' '}
                 <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                   PrivPolicy
                 </a>
              </p>
            </div>
      </div>
    </div>
  )
}
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
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-blue-500/5 to-transparent rounded-full animate-pulse"></div>
      
      <div className="relative w-full max-w-md z-10">
        {/* Main Container */}
        <div className="glass-dark p-8 rounded-3xl border border-gray-800/50 shadow-2xl backdrop-blur-xl animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6 group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <span className="text-3xl font-bold text-black">X</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Xarticle
              </h1>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3 animate-slide-up">
              Join Xarticle
            </h2>
            <p className="text-gray-300 text-base mb-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
              Discover the best articles from X — curated and noise-free.
            </p>
            
            {/* Features */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <span className="hover:text-blue-400 transition-colors cursor-default">No bots</span>
              <span className="text-gray-600">•</span>
              <span className="hover:text-blue-400 transition-colors cursor-default">Curated</span>
              <span className="text-gray-600">•</span>
              <span className="hover:text-blue-400 transition-colors cursor-default">Bilingual</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
            <div className="space-y-2">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-12 h-14 bg-gray-900/50 border-gray-700/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl text-white placeholder-gray-500 text-base backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/50"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-2xl transition-all duration-300 text-base shadow-lg hover:shadow-blue-500/25 transform hover:scale-[1.02] active:scale-[0.98]" 
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
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>
            
            {/* Success Message */}
            {message && (
              <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 backdrop-blur-sm animate-slide-up">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-green-300">{message}</p>
                    <p className="text-xs text-green-400/80 mt-1">
                      The link will expire in 1 hour for security.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 backdrop-blur-sm animate-slide-up">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-400 mr-3 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-red-300">{error}</p>
                    <p className="text-xs text-red-400/80 mt-1">
                      Please try again or contact support if the issue persists.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <p className="text-xs text-gray-500">
            By signing up, you agree to our{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300 underline transition-colors">
              Terms of Service
            </a>{' '}
            •{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300 underline transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
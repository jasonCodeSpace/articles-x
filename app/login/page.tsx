'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, ArrowRight, CheckCircle, XCircle, ArrowLeft, Shield } from 'lucide-react'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { Turnstile } from '@marsidev/react-turnstile'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const verificationSchema = z.object({
  code: z.string().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits'),
})

export default function Login() {
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState<'email' | 'verification'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string>()

  const router = useRouter()
  const supabase = createClient()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const validatedData = emailSchema.parse({ email })
      
      const { error } = await supabase.auth.signInWithOtp({
        email: validatedData.email,
        options: {
          shouldCreateUser: true, // Allow new user creation during login
          captchaToken,
        },
      })

      if (error) {
        console.error('Send OTP error:', error)
        if (error.message.includes('User not found')) {
          setError('No account found with this email address')
        } else {
          setError(error.message || 'Failed to send verification code')
        }
      } else {
        setMessage('Verification code sent! Please check your email.')
        setStep('verification')
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.issues[0].message)
      } else {
        setError('An error occurred while sending verification code')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const validatedData = verificationSchema.parse({ code: verificationCode })
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: validatedData.code,
        type: 'email',
      })

      if (error) {
        console.error('Verification error:', error)
        if (error.message.includes('Token has expired')) {
          setError('Verification code has expired. Please request a new one.')
          setStep('email')
        } else if (error.message.includes('Invalid token')) {
          setError('Invalid verification code. Please try again.')
        } else {
          setError(error.message || 'Verification failed')
        }
      } else if (data?.user) {
        setMessage('Login successful! Redirecting...')
        console.log('Login successful:', data.user.email)
        router.push('/trending')
      } else {
        setError('Login failed, unknown error')
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.issues[0].message)
      } else {
        setError('An error occurred during verification')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setVerificationCode('')
    setMessage('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full animate-pulse"></div>
      
      <div className="relative w-full max-w-md z-10">
        {/* Back Button */}
        <div className="mb-6 animate-slide-up">
          {step === 'verification' ? (
            <Button 
              variant="ghost"
              onClick={handleBackToEmail}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group p-0 h-auto"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm">Back to Email</span>
            </Button>
          ) : (
            <Button variant="ghost" asChild className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group p-0 h-auto">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm">Back to Home</span>
              </Link>
            </Button>
          )}
        </div>
        
        {/* Main Container */}
        <div className="bg-card/50 backdrop-blur-xl p-8 rounded-3xl border border-border shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6 group">
              <div className="w-14 h-14 flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Image src="/logo.svg" alt="Xarticle Logo" width={56} height={56} className="w-14 h-14" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-3 animate-slide-up">
              {step === 'email' ? 'Sign in to Xarticle' : 'Enter Verification Code'}
            </h2>
            <p className="text-muted-foreground text-base mb-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
              {step === 'email' 
                ? 'Enter your email to receive a verification code'
                : `We sent a verification code to ${email}`
              }
            </p>
            
            {/* Features */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <span className="hover:text-primary transition-colors cursor-default">No bots</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="hover:text-primary transition-colors cursor-default">Curated</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="hover:text-primary transition-colors cursor-default">Bilingual</span>
            </div>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || !captchaToken}
                    className="pl-12 h-14 bg-input border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl text-foreground placeholder-muted-foreground text-base backdrop-blur-sm transition-all duration-300 hover:bg-muted/50"
                  />
                </div>
              </div>
              
              <div className="flex justify-center">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAABy2u7ldvQFymnwO'}
                  onSuccess={(token) => {
                    setCaptchaToken(token)
                  }}
                  onError={() => {
                    setCaptchaToken(undefined)
                  }}
                  onExpire={() => {
                    setCaptchaToken(undefined)
                  }}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-2xl transition-all duration-300 text-base shadow-lg hover:shadow-primary/25 transform hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Sending Code...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Send Verification Code
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerificationSubmit} className="space-y-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="space-y-4">
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    disabled={isLoading}
                    className="pl-12 h-14 bg-input border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl text-foreground placeholder-muted-foreground text-base backdrop-blur-sm transition-all duration-300 hover:bg-muted/50 text-center tracking-widest"
                    maxLength={6}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-2xl transition-all duration-300 text-base shadow-lg hover:shadow-primary/25 transform hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Verify & Sign In
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>
              
              <div className="text-center">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors p-0 h-auto"
                >
                  Didn&apos;t receive the code? Try again
                </Button>
              </div>
            </form>
          )}
          
          <div className="text-center space-y-2 mt-6">
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{' '}
              <Link 
                href="/trending" 
                className="text-primary hover:text-primary/80 underline transition-colors"
              >
                Sign up now
              </Link>
            </p>
          </div>
          
          {/* Success Message */}
          {message && (
            <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 backdrop-blur-sm animate-slide-up mt-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3 animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-green-300">{message}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 backdrop-blur-sm animate-slide-up mt-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-destructive mr-3 animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary hover:text-primary/80 underline transition-colors">
              Terms of Service
            </a>{' '}
            •{' '}
            <a href="#" className="text-primary hover:text-primary/80 underline transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, ArrowRight, CheckCircle, XCircle, ArrowLeft, KeyRound } from 'lucide-react'
import { z } from 'zod'
import Link from 'next/link'

const emailSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
})

const verificationSchema = z.object({
  verificationCode: z.string().min(6, '验证码为6位数字'),
})

export default function Register() {
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState<'email' | 'verification'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const validatedData = emailSchema.parse({ email })
      
      // Send OTP to email
      const { error } = await supabase.auth.signInWithOtp({
        email: validatedData.email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: undefined, // Prevent magic link
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setMessage('验证码已发送到您的邮箱，请查收。')
      setStep('verification')
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.issues[0].message)
      } else {
        setError('发送验证码失败，请重试')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const validatedData = verificationSchema.parse({ verificationCode })
      
      // Verify OTP
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: validatedData.verificationCode,
        type: 'email',
      })

      if (error) {
        setError('验证码错误或已过期，请重试')
        return
      }

      setMessage('登录成功！正在跳转...')
      // Redirect to trending page for logged in users
      window.location.href = '/trending'
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.issues[0].message)
      } else {
        setError('验证失败，请重试')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-primary-foreground">X</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {step === 'email' ? '创建账户' : '验证邮箱'}
              </h1>
              <p className="text-muted-foreground text-base">
                {step === 'email' ? '加入 Xarticle 社区，开始发现优质内容' : '请输入发送到您邮箱的验证码'}
              </p>
            </div>
          </div>
          
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="email"
                  placeholder="输入您的邮箱地址"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-12 h-14 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl text-foreground placeholder-muted-foreground text-base backdrop-blur-sm transition-all duration-300 hover:bg-background/70"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium rounded-2xl transition-all duration-300 text-base shadow-lg hover:shadow-primary/25 transform hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                    发送验证码中...
                  </div>
                ) : (
                  <div className="flex items-center">
                    发送验证码
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    验证码已发送至 <span className="font-medium text-foreground">{email}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-sm text-primary hover:text-primary/80 underline mt-2"
                  >
                    更换邮箱
                  </button>
                </div>
                
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="text"
                    placeholder="输入6位验证码"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    disabled={isLoading}
                    maxLength={6}
                    className="pl-12 h-14 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl text-foreground placeholder-muted-foreground text-base backdrop-blur-sm transition-all duration-300 hover:bg-background/70 text-center tracking-widest"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium rounded-2xl transition-all duration-300 text-base shadow-lg hover:shadow-primary/25 transform hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                    验证中...
                  </div>
                ) : (
                  <div className="flex items-center">
                    验证并登录
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          )}
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              已有账户？{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium underline transition-colors">
                立即登录
              </Link>
            </p>
          </div>
          
          {/* Messages */}
          {message && (
            <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
            </div>
          )}
          
          {error && (
            <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>
        
        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Turnstile } from '@marsidev/react-turnstile'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string>()

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password/confirm`,
        captchaToken,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('密码重置链接已发送到您的邮箱，请检查邮件并点击链接重置密码。')
      }
    } catch {
      setError('发送重置邮件时出错，请稍后再试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float [animation-delay:2s]"></div>
      
      <div className="relative w-full max-w-md z-10">
        {/* Back Button */}
        <div className="mb-6 animate-slide-up">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm">返回登录</span>
          </Link>
        </div>
        
        {/* Main Container */}
        <div className="bg-card/70 backdrop-blur-xl border border-border p-8 rounded-3xl shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6 group">
              <div className="w-14 h-14 flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <Image src="/logo.svg" alt="Xarticle Logo" width={56} height={56} className="w-14 h-14" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Xarticle
              </h1>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">重置密码</h2>
            <p className="text-muted-foreground text-base">
              输入您的邮箱地址，我们将发送密码重置链接
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="email"
                placeholder="输入您的邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="pl-12 h-14 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl text-foreground placeholder-muted-foreground text-base backdrop-blur-sm transition-all duration-300 hover:bg-background/70"
              />
            </div>
            
            <div className="flex justify-center">
              <Turnstile
                siteKey="your-sitekey"
                onSuccess={(token) => {
                  setCaptchaToken(token)
                }}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium rounded-2xl transition-all duration-300 text-base shadow-lg hover:shadow-primary/25 transform hover:scale-[1.02] active:scale-[0.98]" 
              disabled={isLoading || !captchaToken}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  发送中...
                </div>
              ) : (
                '发送重置链接'
              )}
            </Button>
            
            {/* Success Message */}
            {message && (
              <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 backdrop-blur-sm">
                <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 backdrop-blur-sm">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

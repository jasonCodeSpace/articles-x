'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, ArrowRight, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
})

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const validatedData = loginSchema.parse({ email, password })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      })

      if (error) {
        console.error('Login error:', error)
        
        // 提供更具体的错误信息
        if (error.message.includes('Invalid login credentials')) {
          setError('邮箱或密码不正确，请检查后重试')
        } else if (error.message.includes('Email not confirmed')) {
          setError('请先确认您的邮箱地址')
        } else if (error.message.includes('Too many requests')) {
          setError('尝试次数过多，请稍后再试')
        } else {
          setError(error.message || '登录失败，请检查邮箱和密码')
        }
      } else if (data?.user) {
        setMessage('登录成功！正在跳转...')
        console.log('Login successful:', data.user.email)
        
        // 登录成功后立即跳转到主页面
        router.push('/new')
      } else {
        setError('登录失败，未知错误')
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.issues[0].message)
      } else {
        setError('登录过程中发生错误')
      }
    } finally {
      setIsLoading(false)
    }
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
          <Link 
            href="/new" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm">返回主页</span>
          </Link>
        </div>
        
        {/* Main Container */}
        <div className="bg-card/50 backdrop-blur-xl p-8 rounded-3xl border border-border shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6 group">
              <div className="w-14 h-14 bg-foreground rounded-2xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <span className="text-3xl font-bold text-background">X</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Xarticle
              </h1>
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-3 animate-slide-up">
              登录 Xarticle
            </h2>
            <p className="text-muted-foreground text-base mb-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
              使用您的邮箱和密码登录账户
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
          <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="email"
                  placeholder="输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-12 h-14 bg-input border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl text-foreground placeholder-muted-foreground text-base backdrop-blur-sm transition-all duration-300 hover:bg-muted/50"
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="password"
                  placeholder="输入您的密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-12 h-14 bg-input border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl text-foreground placeholder-muted-foreground text-base backdrop-blur-sm transition-all duration-300 hover:bg-muted/50"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-2xl transition-all duration-300 text-base shadow-lg hover:shadow-primary/25 transform hover:scale-[1.02] active:scale-[0.98]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  登录中...
                </div>
              ) : (
                <div className="flex items-center">
                  登录
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>
            
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-sm">
                <Link 
                  href="/reset-password" 
                  className="text-primary hover:text-primary/80 underline transition-colors"
                >
                  忘记密码？
                </Link>
              </p>
              <p className="text-muted-foreground text-sm">
                还没有账户？{' '}
                <Link 
                  href="/register" 
                  className="text-primary hover:text-primary/80 underline transition-colors"
                >
                  立即注册
                </Link>
              </p>
            </div>
            
            {/* Success Message */}
            {message && (
              <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 backdrop-blur-sm animate-slide-up">
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
              <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 backdrop-blur-sm animate-slide-up">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-destructive mr-3 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <p className="text-xs text-muted-foreground">
            登录即表示您同意我们的{' '}
            <a href="#" className="text-primary hover:text-primary/80 underline transition-colors">
              服务条款
            </a>{' '}
            •{' '}
            <a href="#" className="text-primary hover:text-primary/80 underline transition-colors">
              隐私政策
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
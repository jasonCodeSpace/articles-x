'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, ArrowRight, CheckCircle, XCircle, ArrowLeft, User } from 'lucide-react'
import { z } from 'zod'
import Link from 'next/link'

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
  confirmPassword: z.string(),
  fullName: z.string().min(1, '请输入您的姓名'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密码不匹配",
  path: ["confirmPassword"],
})

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
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
      const validatedData = registerSchema.parse({ email, password, confirmPassword, fullName })
      
      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            full_name: validatedData.fullName,
          }
        }
      })

      if (error) {
        console.error('Registration error:', error)
        
        if (error.message.includes('User already registered')) {
          setError('此邮箱已被注册，请直接登录或使用其他邮箱')
        } else if (error.message.includes('Password should be at least 6 characters')) {
          setError('密码至少需要6个字符')
        } else {
          setError(error.message || '注册失败，请稍后重试')
        }
      } else if (data?.user) {
        setMessage('注册成功！请检查您的邮箱并点击确认链接完成注册。')
        console.log('Registration successful:', data.user.email)
      } else {
        setError('注册失败，未知错误')
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.issues[0].message)
      } else {
        setError('注册过程中发生错误')
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
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float [animation-delay:2s]"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full animate-pulse"></div>
      
      <div className="relative w-full max-w-md z-10">
        {/* Back Button */}
        <div className="mb-6 animate-slide-up">
          <Link 
            href="/landing" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm">返回首页</span>
          </Link>
        </div>
        
        {/* Main Container */}
        <div className="bg-card/70 backdrop-blur-xl border border-border p-8 rounded-3xl shadow-2xl animate-fade-in">
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
            
            <h2 className="text-2xl font-bold text-foreground mb-3">
              创建账户
            </h2>
            <p className="text-muted-foreground text-base mb-6">
              加入 Xarticle 社区，开始发现优质内容
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="输入您的姓名"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-12 h-14 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl text-foreground placeholder-muted-foreground text-base backdrop-blur-sm transition-all duration-300 hover:bg-background/70"
                />
              </div>
              
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
              
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="password"
                  placeholder="创建密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-12 h-14 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl text-foreground placeholder-muted-foreground text-base backdrop-blur-sm transition-all duration-300 hover:bg-background/70"
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="password"
                  placeholder="确认密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-12 h-14 bg-background/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl text-foreground placeholder-muted-foreground text-base backdrop-blur-sm transition-all duration-300 hover:bg-background/70"
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
                  创建账户中...
                </div>
              ) : (
                <div className="flex items-center">
                  创建账户
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </Button>
            
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                已有账户？{' '}
                <Link 
                  href="/login" 
                  className="text-primary hover:text-primary/80 underline transition-colors"
                >
                  立即登录
                </Link>
              </p>
            </div>
            
            {/* Success Message */}
            {message && (
              <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 backdrop-blur-sm animate-slide-up">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">{message}</p>
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
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            注册即表示您同意我们的{' '}
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
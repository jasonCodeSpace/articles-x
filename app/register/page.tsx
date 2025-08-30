'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Mail, Lock, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    // 验证密码匹配
    if (password !== confirmPassword) {
      setError('密码不匹配')
      setIsLoading(false)
      return
    }

    // 验证密码强度
    if (password.length < 6) {
      setError('密码至少需要6个字符')
      setIsLoading(false)
      return
    }

    // 检查是否包含大写字母
    if (!/[A-Z]/.test(password)) {
      setError('密码必须包含至少一个大写字母')
      setIsLoading(false)
      return
    }

    // 检查是否包含特殊符号
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('密码必须包含至少一个特殊符号 (!@#$%^&*(),.?":{}|<>)')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message || '注册失败，请重试')
      } else {
        setMessage('注册成功！正在跳转...')
        // 直接跳转到文章页面
        setTimeout(() => {
          router.push('/articles')
        }, 1500)
      }
    } catch {
      setError('注册失败，请稍后重试')
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
              创建账户
            </h2>
            <p className="text-gray-300 text-base mb-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
              注册 Xarticle 账户，开始您的阅读之旅
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
          <form onSubmit={handleRegister} className="space-y-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                <Input
                  type="email"
                  placeholder="输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-12 h-14 bg-gray-900/50 border-gray-700/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl text-white placeholder-gray-500 text-base backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/50"
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                <Input
                  type="password"
                  placeholder="输入您的密码（至少6个字符）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-12 h-14 bg-gray-900/50 border-gray-700/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl text-white placeholder-gray-500 text-base backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/50"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                <Input
                  type="password"
                  placeholder="确认您的密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  注册中...
                </div>
              ) : (
                <div className="flex items-center">
                  创建账户
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>
            
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                已有账户？{' '}
                <Link 
                  href="/login" 
                  className="text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  立即登录
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
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 backdrop-blur-sm animate-slide-up">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-400 mr-3 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <p className="text-xs text-gray-500">
            注册即表示您同意我们的{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300 underline transition-colors">
              服务条款
            </a>{' '}
            •{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300 underline transition-colors">
              隐私政策
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
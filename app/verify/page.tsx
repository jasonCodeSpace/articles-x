'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Mail, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

function VerifyContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // 如果没有邮箱参数，重定向到注册页面
      router.push('/register')
    }
  }, [searchParams, router])



  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    if (!password.trim()) {
      setError('请输入密码')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('密码长度至少为6位')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message || '设置密码失败')
      } else {
        setMessage('密码设置成功！正在跳转...')
        setTimeout(() => {
          router.push('/articles')
        }, 1500)
      }
    } catch (error) {
      setError('设置密码过程中发生错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* 动态背景 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-mesh opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/5 to-transparent rounded-full animate-float"></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* 头部 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <h1 className="text-4xl font-bold text-x-gradient hover:scale-105 transition-transform duration-300">
              Xarticle
            </h1>
          </Link>
          <p className="text-gray-400 mt-3 text-lg">设置您的账户密码</p>
        </div>

        {/* 验证表单 */}
        <div className="glass-dark p-8 rounded-2xl border border-gray-800/50 animate-slide-up animation-delay-200">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">设置密码</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              为您的账户 <span className="text-blue-400 font-medium">{email}</span> 设置密码
              <br />请输入至少6位字符的密码
            </p>
          </div>
          <form onSubmit={handleSetPassword} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">密码</label>
              <Input
                id="password"
                type="password"
                placeholder="输入密码（至少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 h-12 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                required
              />
            </div>
            
            <div className="space-y-3">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">确认密码</label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 h-12 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl animate-slide-up">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-center gap-3 p-4 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl animate-slide-up">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-x-gradient hover:opacity-90 text-white font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  设置中...
                </>
              ) : (
                '设置密码并登录'
              )}
            </Button>

            <div className="text-center pt-4 border-t border-gray-800/50">
              <Link 
                href="/register" 
                className="inline-flex items-center text-sm text-gray-400 hover:text-blue-400 transition-colors duration-300 group"
              >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
                返回注册
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-mesh opacity-20"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        </div>
        <div className="relative z-10 w-full max-w-md">
          <div className="glass-dark p-8 rounded-2xl border border-gray-800/50">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-400" />
              <p className="mt-4 text-gray-400">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
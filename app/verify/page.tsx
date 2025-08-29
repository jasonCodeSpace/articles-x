'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Mail, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

function VerifyContent() {
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  
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

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    if (!verificationCode.trim()) {
      setError('请输入验证码')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'signup'
      })

      if (error) {
        setError(error.message || '验证失败，请检查验证码是否正确')
      } else {
        setMessage('验证成功！正在跳转...')
        // 验证成功后跳转到主页或仪表板
        setTimeout(() => {
          router.push('/articles')
        }, 1500)
      }
    } catch (error) {
      setError('验证过程中发生错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResendLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) {
        setError(error.message || '重发验证码失败')
      } else {
        setMessage('验证码已重新发送到您的邮箱')
        setCountdown(60) // 60秒倒计时
      }
    } catch (error) {
      setError('重发验证码时发生错误')
    } finally {
      setResendLoading(false)
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
          <p className="text-gray-400 mt-3 text-lg">验证您的邮箱地址</p>
        </div>

        {/* 验证表单 */}
        <div className="glass-dark p-8 rounded-2xl border border-gray-800/50 animate-slide-up animation-delay-200">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">验证邮箱</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              我们已向 <span className="text-blue-400 font-medium">{email}</span> 发送了验证码
              <br />请输入收到的6位验证码
            </p>
          </div>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="verificationCode" className="text-sm font-medium text-gray-300">验证码</label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="输入6位验证码"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 text-center text-xl tracking-[0.5em] h-14 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                maxLength={6}
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
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  验证中...
                </>
              ) : (
                '验证并登录'
              )}
            </Button>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-400">没有收到验证码？</p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={resendLoading || countdown > 0}
                className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:border-gray-600 hover:text-white transition-all duration-300"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    发送中...
                  </>
                ) : countdown > 0 ? (
                  `重新发送 (${countdown}s)`
                ) : (
                  '重新发送验证码'
                )}
              </Button>
            </div>

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
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function VerifyPage() {
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
      const { data, error } = await supabase.auth.verifyOtp({
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
    } catch (err) {
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
    } catch (err) {
      setError('重发验证码时发生错误')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Xarticle
            </h1>
          </Link>
          <p className="text-gray-600 mt-2">验证您的邮箱地址</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-semibold">验证邮箱</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              我们已向 <span className="font-medium text-gray-800">{email}</span> 发送了验证码
              <br />请输入收到的6位验证码
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="verificationCode" className="text-sm font-medium text-gray-700">验证码</label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="输入6位验证码"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              {message && (
                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    验证中...
                  </>
                ) : (
                  '验证并登录'
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">没有收到验证码？</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={resendLoading || countdown > 0}
                  className="text-sm"
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

              <div className="text-center">
                <Link 
                  href="/register" 
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  返回注册
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
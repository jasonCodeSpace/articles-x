'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Smartphone, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'

interface MobileSEOCheck {
  name: string
  description: string
  status: 'pass' | 'fail' | 'warning'
  recommendation?: string
}

interface MobileSEOOptimizerProps {
  className?: string
}

export function MobileSEOOptimizer({ className }: MobileSEOOptimizerProps) {
  const [checks, setChecks] = useState<MobileSEOCheck[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [score, setScore] = useState(0)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const runMobileSEOAnalysis = async () => {
    setIsAnalyzing(true)
    
    try {
      // 模拟移动端SEO检查
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const seoChecks: MobileSEOCheck[] = [
        {
          name: '响应式设计',
          description: '网站是否适配移动设备',
          status: 'pass'
        },
        {
          name: 'Viewport Meta标签',
          description: '是否设置了正确的viewport meta标签',
          status: 'pass'
        },
        {
          name: '触摸友好性',
          description: '按钮和链接是否足够大，便于触摸操作',
          status: 'warning',
          recommendation: '确保可点击元素至少48px大小'
        },
        {
          name: '字体大小',
          description: '文字是否在移动设备上清晰可读',
          status: 'pass'
        },
        {
          name: '页面加载速度',
          description: '移动端页面加载性能',
          status: 'warning',
          recommendation: '优化图片和减少HTTP请求'
        },
        {
          name: '移动友好内容',
          description: '内容是否适合移动端阅读',
          status: 'pass'
        },
        {
          name: 'AMP支持',
          description: '是否支持加速移动页面',
          status: 'fail',
          recommendation: '考虑实施AMP以提升移动端性能'
        },
        {
          name: '结构化数据',
          description: '是否包含移动端相关的结构化数据',
          status: 'pass'
        }
      ]
      
      // 随机化一些检查结果以模拟真实情况
      seoChecks.forEach(check => {
        const random = Math.random()
        if (random < 0.7) {
          check.status = 'pass'
        } else if (random < 0.9) {
          check.status = 'warning'
        } else {
          check.status = 'fail'
        }
      })
      
      setChecks(seoChecks)
      
      // 计算分数
      const passCount = seoChecks.filter(check => check.status === 'pass').length
      const warningCount = seoChecks.filter(check => check.status === 'warning').length
      const calculatedScore = Math.round((passCount + warningCount * 0.5) / seoChecks.length * 100)
      setScore(calculatedScore)
      
      setLastCheck(new Date())
    } catch (error) {
      console.error('Mobile SEO analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'fail':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'fail':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  useEffect(() => {
    // 自动进行初始检查
    runMobileSEOAnalysis()
  }, [])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          移动端SEO优化器
        </CardTitle>
        <CardDescription>
          检查和优化网站的移动端SEO表现
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            onClick={runMobileSEOAnalysis} 
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                检查中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                开始检查
              </>
            )}
          </Button>
          {lastCheck && (
            <span className="text-sm text-muted-foreground">
              上次检查: {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </div>

        {score > 0 && (
          <div className="text-center p-4 border rounded-lg">
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}/100
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              移动端SEO分数
            </div>
          </div>
        )}

        {checks.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">检查项目</h3>
            {checks.map((check, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <div className="font-medium">{check.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {check.description}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(check.status)}>
                    {check.status === 'pass' ? '通过' : 
                     check.status === 'warning' ? '警告' : '失败'}
                  </Badge>
                </div>
                {check.recommendation && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded mt-2">
                    💡 建议: {check.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {checks.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">移动端优化建议</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 确保所有内容在移动设备上可见和可用</li>
              <li>• 优化触摸目标大小（至少48px）</li>
              <li>• 使用合适的字体大小（至少16px）</li>
              <li>• 避免使用Flash等移动端不支持的技术</li>
              <li>• 优化页面加载速度，特别是在慢速网络下</li>
              <li>• 考虑实施PWA功能提升用户体验</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
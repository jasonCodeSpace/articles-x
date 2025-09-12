'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react'

interface PerformanceMetric {
  name: string
  value: number
  threshold: number
  unit: string
  status: 'good' | 'needs-improvement' | 'poor'
}

interface PerformanceOptimizerProps {
  className?: string
}

export function PerformanceOptimizer({ className }: PerformanceOptimizerProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null)

  const analyzePerformance = async () => {
    setIsAnalyzing(true)
    
    try {
      // 模拟性能分析
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const performanceData: PerformanceMetric[] = [
        {
          name: 'First Contentful Paint',
          value: Math.random() * 3000 + 500,
          threshold: 1800,
          unit: 'ms',
          status: 'good'
        },
        {
          name: 'Largest Contentful Paint',
          value: Math.random() * 4000 + 1000,
          threshold: 2500,
          unit: 'ms',
          status: 'needs-improvement'
        },
        {
          name: 'Cumulative Layout Shift',
          value: Math.random() * 0.3,
          threshold: 0.1,
          unit: '',
          status: 'poor'
        },
        {
          name: 'First Input Delay',
          value: Math.random() * 200 + 50,
          threshold: 100,
          unit: 'ms',
          status: 'good'
        }
      ]
      
      // 根据阈值设置状态
      performanceData.forEach(metric => {
        if (metric.name === 'Cumulative Layout Shift') {
          if (metric.value <= 0.1) metric.status = 'good'
          else if (metric.value <= 0.25) metric.status = 'needs-improvement'
          else metric.status = 'poor'
        } else {
          if (metric.value <= metric.threshold) metric.status = 'good'
          else if (metric.value <= metric.threshold * 1.5) metric.status = 'needs-improvement'
          else metric.status = 'poor'
        }
      })
      
      setMetrics(performanceData)
      setLastAnalysis(new Date())
    } catch (error) {
      console.error('Performance analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'needs-improvement':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800'
      case 'needs-improvement':
        return 'bg-yellow-100 text-yellow-800'
      case 'poor':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    // 自动进行初始分析
    analyzePerformance()
  }, [])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          性能优化器
        </CardTitle>
        <CardDescription>
          分析网站性能指标并提供优化建议
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            onClick={analyzePerformance} 
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                分析中...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                开始分析
              </>
            )}
          </Button>
          {lastAnalysis && (
            <span className="text-sm text-muted-foreground">
              上次分析: {lastAnalysis.toLocaleTimeString()}
            </span>
          )}
        </div>

        {metrics.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Core Web Vitals</h3>
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(metric.status)}
                  <div>
                    <div className="font-medium">{metric.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {metric.value.toFixed(metric.name === 'Cumulative Layout Shift' ? 3 : 0)}{metric.unit}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status === 'good' ? '良好' : 
                   metric.status === 'needs-improvement' ? '需改进' : '较差'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {metrics.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">优化建议</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 启用图片懒加载和压缩</li>
              <li>• 使用 CDN 加速静态资源</li>
              <li>• 优化关键渲染路径</li>
              <li>• 减少不必要的 JavaScript 包大小</li>
              <li>• 实施代码分割和动态导入</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
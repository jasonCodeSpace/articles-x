'use client'

import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PerformanceOptimizer } from '@/components/performance-optimizer'
import { MobileSEOOptimizer } from '@/components/mobile-seo-optimizer'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Smartphone, BarChart3, Zap } from 'lucide-react'

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

export default function PerformancePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">性能优化中心</h1>
        <p className="text-muted-foreground">
          监控和优化网站性能，提升用户体验和SEO表现
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            性能分析
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            移动端SEO
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            实时监控
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  页面加载速度
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">1.2s</div>
                <p className="text-xs text-muted-foreground">
                  平均首屏加载时间
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  移动端友好度
                </CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">92/100</div>
                <p className="text-xs text-muted-foreground">
                  移动端SEO分数
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Core Web Vitals
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">良好</div>
                <p className="text-xs text-muted-foreground">
                  整体性能评级
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>最近优化建议</CardTitle>
                <CardDescription>
                  基于最新分析的性能优化建议
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-red-500 rounded-full" />
                    优化图片压缩和格式
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                    减少JavaScript包大小
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    启用浏览器缓存
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>性能趋势</CardTitle>
                <CardDescription>
                  过去7天的性能变化趋势
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <div className="flex justify-between mb-2">
                    <span>页面加载时间</span>
                    <span className="text-green-600">↓ 15%</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>首屏渲染时间</span>
                    <span className="text-green-600">↓ 8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>累积布局偏移</span>
                    <span className="text-red-600">↑ 3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Suspense fallback={<LoadingSkeleton />}>
            <PerformanceOptimizer />
          </Suspense>
        </TabsContent>

        <TabsContent value="mobile">
          <Suspense fallback={<LoadingSkeleton />}>
            <MobileSEOOptimizer />
          </Suspense>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>实时性能监控</CardTitle>
              <CardDescription>
                实时监控网站性能指标和用户体验
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">当前在线用户</span>
                      <span className="text-2xl font-bold text-blue-600">1,234</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      过去5分钟平均值
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">服务器响应时间</span>
                      <span className="text-2xl font-bold text-green-600">45ms</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      实时平均响应时间
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">监控功能</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 实时Core Web Vitals监控</li>
                    <li>• 用户体验指标追踪</li>
                    <li>• 性能异常自动告警</li>
                    <li>• 地理位置性能分析</li>
                    <li>• 设备类型性能对比</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
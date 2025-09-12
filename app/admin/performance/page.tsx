'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { RefreshCw, TrendingUp, ChevronDown } from 'lucide-react'

// Simple inline components to replace missing UI components
const Select = ({ children }: { children: React.ReactNode, value?: string, onValueChange?: (value: string) => void }) => (
  <div className="relative">
    {children}
  </div>
)

const SelectTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <button className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ${className || ''}`}>
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
)

const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span className="text-muted-foreground">{placeholder || 'Select...'}</span>
)

const SelectContent = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50">
    {children}
  </div>
)

const SelectItem = ({ children }: { children: React.ReactNode, value: string }) => (
  <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
    {children}
  </div>
)

const Badge = ({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: string }) => {
  const variantClasses = variant === 'destructive' ? 'bg-red-100 text-red-800' : 
                        variant === 'secondary' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClasses} ${className || ''}`}>
      {children}
    </span>
  )
}

const Tabs = ({ children, defaultValue, className }: { children: React.ReactNode, defaultValue: string, className?: string }) => (
  <div data-default-value={defaultValue} className={className}>
    {children}
  </div>
)

const TabsList = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className || ''}`}>
    {children}
  </div>
)

const TabsTrigger = ({ children, className }: { children: React.ReactNode, value?: string, className?: string }) => (
  <button className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${className || ''}`}>
    {children}
  </button>
)

const TabsContent = ({ children, className }: { children: React.ReactNode, value?: string, className?: string }) => (
  <div className={`mt-2 ${className || ''}`}>
    {children}
  </div>
)

interface WebVitalData {
  metric_name: string;
  metric_value: number;
  page_url: string;
  user_agent: string;
  created_at: string;
}

interface MetricStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p75: number;
  p95: number;
  p99: number;
}

interface PerformanceData {
  data: WebVitalData[];
  stats: Record<string, MetricStats>;
  count: number;
}

interface ChartDataItem {
  date: string;
  [key: string]: string | number;
}

const METRIC_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 }
};

function getMetricStatus(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = METRIC_THRESHOLDS[metric as keyof typeof METRIC_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function formatMetricValue(metric: string, value: number): string {
  if (metric === 'CLS') {
    return value.toFixed(3);
  }
  return Math.round(value).toString() + 'ms';
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState('7');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        days: selectedDays,
        ...(selectedMetric !== 'all' && { metric: selectedMetric })
      });
      
      const response = await fetch(`/api/analytics/web-vitals?${params}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDays, selectedMetric]);

  useEffect(() => {
    fetchData();
  }, [selectedDays, selectedMetric, fetchData]);

  const chartData = data?.data
    ?.filter(item => selectedMetric === 'all' || item.metric_name === selectedMetric)
    ?.reduce((acc, item) => {
      const date = new Date(item.created_at).toLocaleDateString();
      const existing = acc.find(d => d.date === date);
      
      if (existing) {
        existing[item.metric_name] = ((existing[item.metric_name] as number) || 0) + item.metric_value;
        existing[`${item.metric_name}_count`] = ((existing[`${item.metric_name}_count`] as number) || 0) + 1;
      } else {
        acc.push({
          date,
          [item.metric_name]: item.metric_value,
          [`${item.metric_name}_count`]: 1
        });
      }
      
      return acc;
    }, [] as ChartDataItem[])
    ?.map(item => {
      // Calculate averages
      Object.keys(item).forEach(key => {
        if (key.endsWith('_count')) {
          const metricKey = key.replace('_count', '');
          if (item[metricKey] && item[key]) {
            item[metricKey] = (item[metricKey] as number) / (item[key] as number);
          }
          delete item[key];
        }
      });
      return item;
    }) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">性能监控</h1>
          <p className="text-muted-foreground">Web Vitals 和性能指标监控</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedDays} onValueChange={setSelectedDays}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1天</SelectItem>
              <SelectItem value="7">7天</SelectItem>
              <SelectItem value="30">30天</SelectItem>
              <SelectItem value="90">90天</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有指标</SelectItem>
              <SelectItem value="CLS">CLS</SelectItem>
              <SelectItem value="FCP">FCP</SelectItem>
              <SelectItem value="FID">FID</SelectItem>
              <SelectItem value="LCP">LCP</SelectItem>
              <SelectItem value="TTFB">TTFB</SelectItem>
              <SelectItem value="INP">INP</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总数据点</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.count || 0}</div>
            <p className="text-xs text-muted-foreground">过去 {selectedDays} 天</p>
          </CardContent>
        </Card>
        
        {data?.stats && Object.entries(data.stats).map(([metric, stats]) => {
          const status = getMetricStatus(metric, stats.p75);
          const statusColor = {
            good: 'text-green-600',
            'needs-improvement': 'text-yellow-600',
            poor: 'text-red-600'
          }[status];
          
          return (
            <Card key={metric}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric}</CardTitle>
                <Badge variant={status === 'good' ? 'default' : status === 'needs-improvement' ? 'secondary' : 'destructive'}>
                  {status === 'good' ? '良好' : status === 'needs-improvement' ? '需改进' : '差'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${statusColor}`}>
                  {formatMetricValue(metric, stats.p75)}
                </div>
                <p className="text-xs text-muted-foreground">P75 值</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">趋势图</TabsTrigger>
          <TabsTrigger value="distribution">分布图</TabsTrigger>
          <TabsTrigger value="details">详细数据</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>性能趋势</CardTitle>
              <CardDescription>过去 {selectedDays} 天的性能指标趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  {selectedMetric === 'all' ? (
                    ['CLS', 'FCP', 'FID', 'LCP', 'TTFB', 'INP'].map((metric, index) => (
                      <Line
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        stroke={`hsl(${index * 60}, 70%, 50%)`}
                        strokeWidth={2}
                      />
                    ))
                  ) : (
                    <Line
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke="hsl(220, 70%, 50%)"
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>性能分布</CardTitle>
              <CardDescription>各指标的百分位数分布</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={Object.entries(data?.stats || {}).map(([metric, stats]) => ({
                  metric,
                  P50: stats.p50,
                  P75: stats.p75,
                  P95: stats.p95,
                  P99: stats.p99
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="P50" fill="hsl(120, 70%, 50%)" />
                  <Bar dataKey="P75" fill="hsl(60, 70%, 50%)" />
                  <Bar dataKey="P95" fill="hsl(30, 70%, 50%)" />
                  <Bar dataKey="P99" fill="hsl(0, 70%, 50%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>详细统计</CardTitle>
              <CardDescription>各指标的详细统计信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">指标</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">数量</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">最小值</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">平均值</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">P50</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">P75</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">P95</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">最大值</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data?.stats || {}).map(([metric, stats]) => {
                      const status = getMetricStatus(metric, stats.p75);
                      return (
                        <tr key={metric}>
                          <td className="border border-gray-300 px-4 py-2 font-medium">{metric}</td>
                          <td className="border border-gray-300 px-4 py-2">{stats.count}</td>
                          <td className="border border-gray-300 px-4 py-2">{formatMetricValue(metric, stats.min)}</td>
                          <td className="border border-gray-300 px-4 py-2">{formatMetricValue(metric, stats.avg)}</td>
                          <td className="border border-gray-300 px-4 py-2">{formatMetricValue(metric, stats.p50)}</td>
                          <td className="border border-gray-300 px-4 py-2">{formatMetricValue(metric, stats.p75)}</td>
                          <td className="border border-gray-300 px-4 py-2">{formatMetricValue(metric, stats.p95)}</td>
                          <td className="border border-gray-300 px-4 py-2">{formatMetricValue(metric, stats.max)}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <Badge variant={status === 'good' ? 'default' : status === 'needs-improvement' ? 'secondary' : 'destructive'}>
                              {status === 'good' ? '良好' : status === 'needs-improvement' ? '需改进' : '差'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
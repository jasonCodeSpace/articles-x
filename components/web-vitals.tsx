'use client';

import { useEffect } from 'react';
import { getCLS, getFCP, getFID, getLCP, getTTFB, Metric } from 'web-vitals';

interface WebVitalsProps {
  onMetric?: (metric: Metric) => void;
}

export function WebVitals({ onMetric }: WebVitalsProps) {
  useEffect(() => {
    const handleMetric = (metric: Metric) => {
      // 发送到自定义分析服务或Supabase
      if (onMetric) {
        onMetric(metric);
      } else {
        // 默认发送到控制台（开发环境）
        if (process.env.NODE_ENV === 'development') {
          console.log('Web Vital:', metric);
        }
        
        // 发送到分析服务
        sendToAnalytics(metric);
      }
    };

    // 监听所有核心Web Vitals指标
    getCLS(handleMetric);
    getFCP(handleMetric);
    getFID(handleMetric);
    getLCP(handleMetric);
    getTTFB(handleMetric);
  }, [onMetric]);

  return null;
}

// 发送指标到分析服务
async function sendToAnalytics(metric: Metric) {
  try {
    // 发送到自定义API端点
    await fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      }),
    });
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error('Failed to send web vitals:', error);
  }
}

// 性能预算检查
export function checkPerformanceBudget(metric: Metric): boolean {
  const budgets = {
    LCP: 2500, // 2.5s
    FID: 100,  // 100ms
    CLS: 0.1,  // 0.1
    FCP: 1800, // 1.8s
    TTFB: 800, // 800ms
  };

  const budget = budgets[metric.name as keyof typeof budgets];
  if (budget && metric.value > budget) {
    console.warn(`Performance budget exceeded for ${metric.name}: ${metric.value} > ${budget}`);
    return false;
  }
  
  return true;
}

// 获取设备类型
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// 获取连接类型
export function getConnectionType(): string {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'unknown';
  }
  
  const connection = (navigator as any).connection;
  return connection?.effectiveType || 'unknown';
}
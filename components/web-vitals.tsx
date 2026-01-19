'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

interface WebVitalsProps {
  onMetric?: (metric: Metric) => void;
}

export function WebVitals({ onMetric }: WebVitalsProps) {
  useEffect(() => {
    // Use requestIdleCallback to defer non-critical work
    const scheduleMetricSend = (metric: Metric) => {
      // Use requestIdleCallback if available, otherwise use setTimeout
      const scheduleFn = typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 0);

      scheduleFn(() => {
        handleMetric(metric);
      });
    };

    const handleMetric = (metric: Metric) => {
      // 发送到自定义分析服务或Supabase
      if (onMetric) {
        onMetric(metric);
      } else {
        // 默认发送到控制台（开发环境）
        if (process.env.NODE_ENV === 'development') {
          console.log('Web Vital:', metric);
        }

        // 发送到分析服务（使用 batch sending）
        queueMetricForSending(metric);
      }
    };

    // 监听所有核心Web Vitals指标
    onCLS(scheduleMetricSend);
    onFCP(scheduleMetricSend);
    onINP(scheduleMetricSend);
    onLCP(scheduleMetricSend);
    onTTFB(scheduleMetricSend);
  }, [onMetric]);

  return null;
}

// Metric queue for batch sending to reduce network requests
const metricQueue: Metric[] = [];
let sendTimeout: NodeJS.Timeout | null = null;

function queueMetricForSending(metric: Metric) {
  metricQueue.push(metric);

  // Clear existing timeout
  if (sendTimeout) {
    clearTimeout(sendTimeout);
  }

  // Send batched metrics after 2 seconds of inactivity
  sendTimeout = setTimeout(() => {
    sendBatchedMetrics();
  }, 2000);
}

// 发送指标到分析服务
async function sendBatchedMetrics() {
  if (metricQueue.length === 0) return;

  const metricsToSend = [...metricQueue];
  metricQueue.length = 0; // Clear queue

  try {
    // 确保只在客户端执行
    if (typeof window === 'undefined') return;

    // 发送到自定义API端点
    await fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: metricsToSend,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      }),
      // Use keepalive to ensure request completes even if page is unloaded
      keepalive: true,
    });
  } catch (error) {
    // 静默失败，不影响用户体验
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to send web vitals:', error);
    }
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

  const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
  return connection?.effectiveType || 'unknown';
}

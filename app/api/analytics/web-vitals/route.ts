import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      value,
      id,
      url,
      userAgent,
    } = body;

    // 验证必需字段
    if (!name || value === undefined || !id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }



    const supabase = await createClient();

    // 插入Web Vitals数据 (只使用存在的列)
    const { error } = await supabase
      .from('web_vitals')
      .insert({
        metric_name: name,
        metric_value: value,
        user_agent: userAgent,
        connection_type: 'unknown',
        page_url: url,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error inserting web vitals:', error);
      return NextResponse.json(
        { error: 'Failed to store metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Web vitals API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取Web Vitals统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const metric = searchParams.get('metric');
    
    const supabase = await createClient();
    
    let query = supabase
      .from('web_vitals')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    
    if (metric) {
      query = query.eq('metric_name', metric);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching web vitals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }
    
    // 计算统计信息
    const stats = calculateStats(data || []);
    
    return NextResponse.json({
      data,
      stats,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Web vitals GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateStats(data: Array<{ metric_name: string; metric_value: number }>) {
  if (!data.length) return {};
  
  const groupedByMetric = data.reduce((acc, item) => {
    const metric = item.metric_name;
    if (!acc[metric]) acc[metric] = [];
    acc[metric].push(item.metric_value);
    return acc;
  }, {} as Record<string, number[]>);
  
  const stats: Record<string, { count: number; min: number; max: number; p50: number; p75: number; p95: number; p99: number; avg: number }> = {};
  
  Object.entries(groupedByMetric).forEach(([metric, values]) => {
    const typedValues = values as number[];
    const sortedValues = typedValues.sort((a: number, b: number) => a - b);
    const length = sortedValues.length;
    
    stats[metric] = {
      count: length,
      min: sortedValues[0],
      max: sortedValues[length - 1],
      avg: typedValues.reduce((sum: number, val: number) => sum + val, 0) / length,
      p50: sortedValues[Math.floor(length * 0.5)],
      p75: sortedValues[Math.floor(length * 0.75)],
      p95: sortedValues[Math.floor(length * 0.95)],
      p99: sortedValues[Math.floor(length * 0.99)],
    };
  });
  
  return stats;
}
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the latest daily summary
    const { data: summary, error } = await supabase
      .from('daily_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      console.error('Error fetching daily summary:', error)
      return NextResponse.json(
        { error: 'Failed to fetch daily summary' },
        { status: 500 }
      )
    }
    
    if (!summary) {
      return NextResponse.json(
        { error: 'No daily summary found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ summary })
    
  } catch (error) {
    console.error('Error in daily summary API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
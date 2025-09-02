import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null)
    
    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
    
    const uniqueCategories = new Set<string>()
    data?.forEach((article: { category: string }) => {
      if (article.category) {
        // Only take the first category for single tag support
        const firstCategory = article.category.split(',')[0].trim()
        uniqueCategories.add(firstCategory)
      }
    })
    
    const categories = Array.from(uniqueCategories).sort()
    
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
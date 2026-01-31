import { NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/server'

async function getArticleCategorySlug(slug: string): Promise<string | null> {
  try {
    const supabase = createAnonClient()

    // First try to get from junction table
    const { data: article, error } = await supabase
      .from('articles')
      .select('id, category')
      .eq('slug', slug)
      .maybeSingle()

    if (error || !article) {
      console.error('Article not found', error)
      return null
    }

    // Try to get primary category from junction table
    const { data: primaryCategory } = await supabase
      .from('article_categories')
      .select('category')
      .eq('article_id', article.id)
      .eq('is_primary', true)
      .maybeSingle()

    if (primaryCategory?.category) {
      return primaryCategory.category.replace(':', '-')
    }

    // Fallback to article.category
    if (article.category) {
      return article.category.replace(':', '-')
    }

    return null
  } catch (error) {
    console.error('Error', error)
    return null
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Slug not provided' }, { status: 400 })
    }

    const categorySlug = await getArticleCategorySlug(slug)

    if (!categorySlug) {
      return NextResponse.json({
        error: 'Category not found',
        slug,
        message: 'No category found for this article'
      }, { status: 404 })
    }

    return NextResponse.json({
      slug,
      category: categorySlug,
      redirectUrl: `/article/${categorySlug}/${slug}`
    })
  } catch (error) {
    console.error('Error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

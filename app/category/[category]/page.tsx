import { redirect } from 'next/navigation'
import { generateCategorySlug, categorySlugToDisplayName } from '@/lib/url-utils'

interface PageProps {
  params: Promise<{ category: string }>
}

// Define standard categories
const STANDARD_CATEGORIES = [
  'Hardware', 'Gaming', 'Health', 'Environment', 'Personal Story',
  'Culture', 'Philosophy', 'History', 'Education', 'Design',
  'Marketing', 'AI', 'Crypto', 'Tech', 'Data', 'Startups',
  'Business', 'Markets', 'Product', 'Security', 'Policy',
  'Science', 'Media'
]

// Generate static params for standard categories to keep URLs valid
export async function generateStaticParams() {
  return STANDARD_CATEGORIES.map((category) => ({
    category: generateCategorySlug(category),
  }))
}

export const dynamic = 'force-static'

// Redirect category pages to trending with category filter
export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params
  const slug = category.toLowerCase()
  const decodedCategory = categorySlugToDisplayName(slug)

  // Redirect to trending with category filter
  if (slug === 'all') {
    redirect('/trending')
  } else {
    redirect(`/trending?category=${encodeURIComponent(decodedCategory)}`)
  }
}

/**
 * Article Category System
 * 5 main categories with 23 sub-categories
 */

export interface Category {
  id: string
  name: string
  subcategories: Subcategory[]
}

export interface Subcategory {
  id: string
  name: string
  mainCategory: string
}

// 5 Main Categories with 23 Sub-categories
export const CATEGORIES: Category[] = [
  {
    id: 'tech',
    name: 'Technology',
    subcategories: [
      { id: 'ai', name: 'AI', mainCategory: 'tech' },
      { id: 'crypto', name: 'Crypto', mainCategory: 'tech' },
      { id: 'data', name: 'Data', mainCategory: 'tech' },
      { id: 'security', name: 'Security', mainCategory: 'tech' },
      { id: 'hardware', name: 'Hardware', mainCategory: 'tech' },
    ]
  },
  {
    id: 'business',
    name: 'Business & Finance',
    subcategories: [
      { id: 'startups', name: 'Startups', mainCategory: 'business' },
      { id: 'markets', name: 'Markets', mainCategory: 'business' },
      { id: 'marketing', name: 'Marketing', mainCategory: 'business' },
    ]
  },
  {
    id: 'product',
    name: 'Product & Design',
    subcategories: [
      { id: 'product', name: 'Product', mainCategory: 'product' },
      { id: 'design', name: 'Design', mainCategory: 'product' },
      { id: 'gaming', name: 'Gaming', mainCategory: 'product' },
    ]
  },
  {
    id: 'science',
    name: 'Science & Learning',
    subcategories: [
      { id: 'science', name: 'Science', mainCategory: 'science' },
      { id: 'health', name: 'Health', mainCategory: 'science' },
      { id: 'education', name: 'Education', mainCategory: 'science' },
      { id: 'environment', name: 'Environment', mainCategory: 'science' },
    ]
  },
  {
    id: 'culture',
    name: 'Culture & Society',
    subcategories: [
      { id: 'media', name: 'Media', mainCategory: 'culture' },
      { id: 'culture', name: 'Culture', mainCategory: 'culture' },
      { id: 'philosophy', name: 'Philosophy', mainCategory: 'culture' },
      { id: 'history', name: 'History', mainCategory: 'culture' },
      { id: 'policy', name: 'Policy', mainCategory: 'culture' },
      { id: 'personal-story', name: 'Personal Story', mainCategory: 'culture' },
    ]
  }
]

// Flatten all subcategories for easy lookup
export const ALL_SUBCATEGORIES = CATEGORIES.flatMap(cat =>
  cat.subcategories.map(sub => ({ ...sub, mainCategoryName: cat.name }))
)

// Get main category by subcategory ID
export function getMainCategory(subcategoryId: string): string | undefined {
  const sub = ALL_SUBCATEGORIES.find(s => s.id === subcategoryId)
  return sub?.mainCategory
}

// Get category name by ID
export function getCategoryName(categoryId: string): string | undefined {
  const mainCat = CATEGORIES.find(c => c.id === categoryId)
  if (mainCat) return mainCat.name

  const subCat = ALL_SUBCATEGORIES.find(s => s.id === categoryId)
  return subCat?.name
}

// All category IDs for validation
export const ALL_CATEGORY_IDS = [
  ...CATEGORIES.map(c => c.id),
  ...ALL_SUBCATEGORIES.map(s => s.id)
]

// Default category for unclassified articles
export const DEFAULT_CATEGORY = 'tech'

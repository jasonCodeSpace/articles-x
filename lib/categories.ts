/**
 * Article Category System
 * 5 main categories with 23 sub-categories
 *
 * Note: Subcategory IDs use the format "main:sub" (e.g., "tech:ai")
 * to match the database category column format.
 */

export interface Category {
  id: string
  name: string
  subcategories: Subcategory[]
}

export interface Subcategory {
  id: string // Format: "main:sub" e.g., "tech:ai"
  name: string
  mainCategory: string
}

// 5 Main Categories with 23 Sub-categories
export const CATEGORIES: Category[] = [
  {
    id: 'tech',
    name: 'Technology',
    subcategories: [
      { id: 'tech:ai', name: 'AI', mainCategory: 'tech' },
      { id: 'tech:crypto', name: 'Crypto', mainCategory: 'tech' },
      { id: 'tech:data', name: 'Data', mainCategory: 'tech' },
      { id: 'tech:security', name: 'Security', mainCategory: 'tech' },
      { id: 'tech:hardware', name: 'Hardware', mainCategory: 'tech' },
    ]
  },
  {
    id: 'business',
    name: 'Business & Finance',
    subcategories: [
      { id: 'business:startups', name: 'Startups', mainCategory: 'business' },
      { id: 'business:markets', name: 'Markets', mainCategory: 'business' },
      { id: 'business:marketing', name: 'Marketing', mainCategory: 'business' },
    ]
  },
  {
    id: 'product',
    name: 'Product & Design',
    subcategories: [
      { id: 'product:product', name: 'Product', mainCategory: 'product' },
      { id: 'product:design', name: 'Design', mainCategory: 'product' },
      { id: 'product:gaming', name: 'Gaming', mainCategory: 'product' },
    ]
  },
  {
    id: 'science',
    name: 'Science & Learning',
    subcategories: [
      { id: 'science:science', name: 'Science', mainCategory: 'science' },
      { id: 'science:health', name: 'Health', mainCategory: 'science' },
      { id: 'science:education', name: 'Education', mainCategory: 'science' },
      { id: 'science:environment', name: 'Environment', mainCategory: 'science' },
    ]
  },
  {
    id: 'culture',
    name: 'Culture & Society',
    subcategories: [
      { id: 'culture:media', name: 'Media', mainCategory: 'culture' },
      { id: 'culture:culture', name: 'Culture', mainCategory: 'culture' },
      { id: 'culture:philosophy', name: 'Philosophy', mainCategory: 'culture' },
      { id: 'culture:history', name: 'History', mainCategory: 'culture' },
      { id: 'culture:policy', name: 'Policy', mainCategory: 'culture' },
      { id: 'culture:personal-story', name: 'Personal Story', mainCategory: 'culture' },
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

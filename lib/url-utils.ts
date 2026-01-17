/**
 * Utility functions for generating and parsing article URLs
 * 
 * IMPORTANT: Article slugs should ONLY be generated ONCE when creating a new article.
 * Once a slug is generated, it should NEVER be modified by any other code.
 * This ensures URL stability and prevents broken links.
 * 
 * The only place where article slugs should be generated:
 * - lib/ingest.ts (when creating articles from harvested data)
 * - app/api/process-articles/route.ts (when creating articles from tweet processing)
 * - app/api/process-articles/route.ts (when creating articles from processed tweets)
 */

/**
 * Generate URL-safe slug from title
 * For non-English titles, use title_english instead
 */
export function generateSlugFromTitle(title: string): string {
  if (!title || title.trim().length === 0) {
    return ''
  }

  return title
    .toLowerCase()
    .normalize('NFD')                          // Decompose accents
    .replace(/[\u0300-\u036f]/g, '')          // Remove accent marks
    .replace(/[_\s]+/g, '-')                  // Spaces/underscores → hyphens
    .replace(/[^a-z0-9-]/g, '')               // Remove non-alphanumeric
    .replace(/-+/g, '-')                      // Collapse multiple hyphens
    .replace(/^-|-$/g, '')                    // Trim leading/trailing hyphens
    .substring(0, 100)                        // Limit length
}

/**
 * Generate slug with fallback for non-English titles
 */
export function generateSlug(title: string, titleEnglish: string | null, tweetId: string): string {
  // Try English title first for non-English content
  if (titleEnglish && !isEnglish(title)) {
    const slug = generateSlugFromTitle(titleEnglish)
    if (slug.length > 0) return slug
  }

  // Try original title
  const slug = generateSlugFromTitle(title)
  if (slug.length > 0) return slug

  // Fallback: article-{first 6 chars of tweet_id}
  const shortId = tweetId.replace(/-/g, '').substring(0, 6)
  return `article-${shortId}`
}

/**
 * Generate a URL-friendly slug from category name
 */
export function generateCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

/**
 * Convert category slug back to display name
 */
export function categorySlugToDisplayName(slug: string): string {
  // Special handling for "all" category
  if (slug.toLowerCase() === 'all') {
    return 'All Category'
  }
  
  // Special handling for common acronyms that should be uppercase
  const acronyms = ['ai', 'ui', 'ux', 'api', 'seo', 'ceo', 'cto', 'ipo']
  
  return slug
    .split('-')
    .map(word => {
      const lowerWord = word.toLowerCase()
      if (acronyms.includes(lowerWord)) {
        return lowerWord.toUpperCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Generate a short ID from UUID (first 6 characters)
 */
export function generateShortId(uuid: string): string {
  return uuid.replace(/-/g, '').substring(0, 6)
}

/**
 * Generate article URL with meaningful title and permanent ID
 * Format: /article/title-slug--shortId
 */
export function generateArticleUrl(title: string, id: string): string {
  const titleSlug = generateSlugFromTitle(title)
  const shortId = generateShortId(id)
  return `/article/${titleSlug}--${shortId}`
}

/**
 * Extract article ID from article URL slug
 */
export function extractArticleIdFromSlug(slug: string): string {
  const parts = slug.split('--')
  const lastPart = parts[parts.length - 1]
  // Remove any leading dashes that might be present
  return lastPart.replace(/^-+/, '')
}

/**
 * Generate full article URL for sharing
 */
export function generateShareableUrl(title: string, id: string, baseUrl?: string): string {
  const articlePath = generateArticleUrl(title, id)
  const domain = baseUrl || 'https://www.xarticle.news'
  return `${domain}${articlePath}`
}

/**
 * Detect if text is primarily English (Latin characters)
 * Returns true if >50% of letters are Latin alphabet
 */
export function isEnglish(text: string): boolean {
  if (!text || text.trim().length === 0) return true

  // Keep only letters (Latin + CJK + Japanese)
  const letters = text.replace(/[^a-zA-Z\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, '')
  if (letters.length === 0) return true

  const latinChars = letters.replace(/[^a-zA-Z]/g, '').length
  return latinChars / letters.length > 0.5
}
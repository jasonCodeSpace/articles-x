/**
 * Utility functions for generating and parsing article URLs
 *
 * Article slugs are generated from title_english (or title if no English translation)
 * Format: lowercase words separated by hyphens, no ID suffix
 * Example: "networking-at-crypto-events-a-guide-to-doing-it-right"
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
 * Generate slug with preference for English title
 * Always uses title_english if available (regardless of original language)
 */
export function generateSlug(title: string, titleEnglish: string | null, tweetId: string): string {
  // Always prefer English title if available
  if (titleEnglish) {
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
 * Generate article URL with slug (no ID suffix)
 * Format: /article/title-slug
 */
export function generateArticleUrl(title: string, _id: string): string {
  const titleSlug = generateSlugFromTitle(title)
  return `/article/${titleSlug}`
}

/**
 * Note: extractArticleIdFromSlug is deprecated
 * Articles are now looked up directly by slug
 */
export function extractArticleIdFromSlug(slug: string): string {
  // Deprecated - kept for backwards compatibility
  const parts = slug.split('--')
  return parts[parts.length - 1].replace(/^-+/, '')
}

/**
 * Generate full article URL for sharing
 */
export function generateShareableUrl(title: string, _id: string, baseUrl?: string): string {
  const titleSlug = generateSlugFromTitle(title)
  const domain = baseUrl || 'https://www.xarticle.news'
  return `${domain}/article/${titleSlug}`
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
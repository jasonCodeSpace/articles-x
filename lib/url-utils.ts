/**
 * Utility functions for generating and parsing article URLs
 */

/**
 * Generate a URL-friendly slug from article title
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 50) // Limit length
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
  return parts[parts.length - 1]
}

/**
 * Generate full article URL for sharing
 */
export function generateShareableUrl(title: string, id: string, baseUrl?: string): string {
  const articlePath = generateArticleUrl(title, id)
  const domain = baseUrl || 'https://articles-x.vercel.app'
  return `${domain}${articlePath}`
}
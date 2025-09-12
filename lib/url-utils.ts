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
 * Generate a URL-friendly slug from article title
 * Implements multi-level fallback to avoid empty/meaningless title parts (e.g., "de--xxxxxx").
 */
export function generateSlugFromTitle(title: string): string {
  const nowFallback = () => {
    const d = new Date()
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `post-${y}${m}${day}`
  }

  if (!title || title.trim().length === 0) {
    return nowFallback()
  }

  // Base cleaning: strip HTML tags, emoji, control chars
  let raw = title
    .replace(/<[^>]*>/g, ' ') // strip HTML
    .replace(/[\u0000-\u001F\u007F]+/g, ' ') // control chars
    // rough emoji and symbols range
    .replace(/[\u{1F000}-\u{1FAFF}\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Detect scripts
  const hasCJK = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uAC00-\uD7AF]/.test(raw)

  // English stopwords to drop during slug creation
  const stopwords = new Set([
    'a','an','the','of','and','or','for','to','in','on','at','by','with','from','as','is','are','was','were','be','been','being','that','this','these','those','it','its','into','over','about'
  ])

  // Tech whitelist to preserve
  const whitelist = new Set(['ai','gpt','openai','llm','ml','nlp','cv','web3','solana','ethereum','eth','token','api','sdk','ios','android','node','nextjs','react','vite','rust','go','python'])

  // Helper: normalize Latin letters (remove accents), tokenize to words, drop stopwords unless whitelisted
  const normalizeLatin = (text: string) => {
    const lowered = text
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
    const tokens = (lowered.match(/[a-z0-9]+/g) || [])
    const kept = tokens.filter(t => whitelist.has(t) || !stopwords.has(t))
    return kept
  }

  // Step 1: If the title already has enough Latin tokens, use them
  let tokens = normalizeLatin(raw)

  // Step 2: CJK handling — remove frequent Chinese particles, harvest embedded ASCII tokens
  if (hasCJK) {
    const chineseStop = /[的了在是和与即及或而把被上下午上午中对用于以为了给从]/g
    const stripped = raw.replace(chineseStop, ' ')
    const asciiTokens = normalizeLatin(stripped)
    if (asciiTokens.length >= 2) {
      tokens = asciiTokens
    } else if (asciiTokens.length === 1 && tokens.length === 0) {
      tokens = asciiTokens
    }
  }

  // If still empty, fall back to best-effort initials from any Latin present
  if (tokens.length === 0) {
    const asciiWords = (raw.match(/[A-Za-z0-9]{2,}/g) || []).map(w => w.toLowerCase())
    if (asciiWords.length > 0) tokens = asciiWords
  }

  // Build slug candidate
  let slug = tokens.join('-')

  // As a final non-Latin fallback, derive simple consonant-like initials from words split by whitespace
  if (!slug) {
    const rough = raw.split(/\s+/).map(w => w.replace(/[^A-Za-z0-9]/g, '').toLowerCase()).filter(Boolean)
    if (rough.length > 0) slug = rough.slice(0, 3).join('-')
  }

  // If still too short, use date-based fallback
  if (!slug || slug.replace(/-/g, '').length < 3) {
    slug = nowFallback()
  }

  // Cleanup: collapse hyphens, trim, enforce length and per-segment constraints
  slug = slug
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Enforce max title-part length 50
  if (slug.length > 50) {
    // prefer cutting at word boundary within 50
    const cut = slug.slice(0, 50)
    const idx = cut.lastIndexOf('-')
    slug = idx > 20 ? cut.slice(0, idx) : cut
  }

  // Enforce each segment <= 15 by soft splitting long segments
  const softSplit = (segment: string) => {
    if (segment.length <= 15) return segment
    const parts: string[] = []
    let s = segment
    while (s.length > 15) {
      parts.push(s.slice(0, 15))
      s = s.slice(15)
    }
    if (s) parts.push(s)
    return parts.join('-')
  }
  slug = slug.split('-').map(softSplit).join('-')

  // Final safety
  slug = slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '')
  if (!slug) slug = nowFallback()

  return slug
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

/**
 * Utility functions for generating and parsing article URLs
 * 
 * IMPORTANT: Article slugs should ONLY be generated ONCE when creating a new article.
 * Once a slug is generated, it should NEVER be modified by any other code.
 * This ensures URL stability and prevents broken links.
 * 
 * The only place where article slugs should be generated:
 * - lib/ingest.ts (when creating articles from harvested data)
 * - app/api/fetch-tweet-details/route.ts (when creating articles from tweet details)
 * - app/api/process-articles/route.ts (when creating articles from processed tweets)
 */

/**
 * Generate a URL-friendly slug from article title
 */
export function generateSlugFromTitle(title: string): string {
  if (!title || title.trim().length === 0) {
    return 'article';
  }

  // Check if title contains CJK characters
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff]/;
  const hasCJK = cjkRegex.test(title);
  
  if (hasCJK) {
    // For CJK text, transliterate to ASCII if possible, otherwise use romanization
    let processedTitle = title
      .replace(/[\u4e00-\u9fff]/g, (char) => {
        // Simple mapping for common Chinese characters to pinyin
        const pinyinMap: { [key: string]: string } = {
          '人': 'ren', '工': 'gong', '智': 'zhi', '能': 'neng', '的': 'de',
          '未': 'wei', '来': 'lai', '发': 'fa', '展': 'zhan', '趋': 'qu', '势': 'shi'
        };
        return pinyinMap[char] ? pinyinMap[char] + '-' : char;
      })
      .replace(/[\u3040-\u309f\u30a0-\u30ff]/g, (char) => {
        // Simple mapping for common Japanese characters to romaji
        const romajiMap: { [key: string]: string } = {
          'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
          'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
          'に': 'ni', 'つ': 'tsu', 'て': 'te'
        };
        return romajiMap[char] ? romajiMap[char] + '-' : char;
      })
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove remaining non-ASCII characters
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    if (!processedTitle || processedTitle.length < 1) {
      return 'article';
    }
    
    return processedTitle.substring(0, 50).replace(/-+$/, '');
  }
  
  // For non-CJK text, use improved logic with better word separation
  let slug = title
    .toLowerCase()
    .trim()
    // First, normalize common punctuation to spaces to preserve word boundaries
    .replace(/['"''""]/g, '') // Remove quotes
    .replace(/[.,!?;:()\[\]{}]/g, ' ') // Replace punctuation with spaces
    .replace(/[&+]/g, ' and ') // Replace & and + with 'and'
    .replace(/[@#$%^*=|\\/<>]/g, ' ') // Replace other special chars with spaces
    // Handle common contractions and abbreviations
    .replace(/\b(can't|won't|don't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|wouldn't|shouldn't|couldn't)\b/g, (match) => {
      const contractions: { [key: string]: string } = {
        "can't": "cannot", "won't": "will-not", "don't": "do-not", 
        "isn't": "is-not", "aren't": "are-not", "wasn't": "was-not", 
        "weren't": "were-not", "hasn't": "has-not", "haven't": "have-not", 
        "hadn't": "had-not", "wouldn't": "would-not", "shouldn't": "should-not", 
        "couldn't": "could-not"
      };
      return contractions[match] || match;
    })
    // Remove remaining non-alphanumeric characters except spaces and existing hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Normalize whitespace and convert to hyphens
    .replace(/\s+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // If slug is empty or too short, return 'article'
  if (!slug || slug.length < 1) {
    return 'article';
  }

  // Limit length to 50 characters and ensure it doesn't end with a hyphen
  if (slug.length > 50) {
    // Find the last complete word within 50 characters
    const truncated = slug.substring(0, 50);
    const lastHyphenIndex = truncated.lastIndexOf('-');
    if (lastHyphenIndex > 20) { // Only truncate at word boundary if it's not too short
      slug = truncated.substring(0, lastHyphenIndex);
    } else {
      slug = truncated;
    }
  }
  
  return slug.replace(/-+$/, ''); // Remove any trailing hyphens
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
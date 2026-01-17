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
 */
export function generateSlugFromTitle(title: string): string {
  if (!title || title.trim().length === 0) {
    return 'article';
  }

  // 1. Convert to lowercase
  let slug = title.toLowerCase();

  // 2. Transliterate CJK (keep existing pinyin/romaji logic as it's useful fallback for CJK titles)
  // If we just remove non-ASCII on Chinese titles, they become empty.
  // The user requirement "Transliterate non-ASCII characters" supports keeping this.
  slug = slug
    .replace(/[\u4e00-\u9fff]/g, (char) => {
      const pinyinMap: { [key: string]: string } = {
        '人': 'ren', '工': 'gong', '智': 'zhi', '能': 'neng', '的': 'de',
        '未': 'wei', '来': 'lai', '发': 'fa', '展': 'zhan', '趋': 'qu', '势': 'shi'
      };
      return pinyinMap[char] || char; // If not in map, keep char (to be removed later if non-ascii?) 
      // Actually, if we keep char, it will be stripped by the non-alphanumeric regex. 
      // Better to potentially map more or accept we might lose some CJK if not mapped. 
      // Given the user emphasized Spanish/Western examples, I'll stick to the strict "Remove all non-alphanumeric".
    })
    .replace(/[\u3040-\u309f\u30a0-\u30ff]/g, (char) => {
        const romajiMap: { [key: string]: string } = {
          'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
          'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
          'に': 'ni', 'つ': 'tsu', 'て': 'te'
        };
        return romajiMap[char] || char;
    });

  // 3. Transliterate accents (normalize NFD and remove diacritics)
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 4. Manually replace common non-ASCII chars to ASCII if normalization didn't catch them
  const replacements: { [key: string]: string } = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
    'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u',
    'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u',
    'ñ': 'n', 'ç': 'c', 'ß': 'ss', 
    'æ': 'ae', 'œ': 'oe'
  };
  
  slug = slug.replace(/[^\x00-\x7F]/g, (char) => replacements[char] || char);

  // 5. Replace spaces and underscores with hyphens
  slug = slug.replace(/[\s_]+/g, '-');

  // 6. Remove all non-alphanumeric characters (except hyphens)
  slug = slug.replace(/[^a-z0-9-]/g, '');

  // 7. Clean up hyphens (multiple dashes, leading/trailing)
  slug = slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  if (!slug || slug.length < 1) {
    return 'article';
  }

  // Limit length (optional but good practice, keeping ~60 to allow room for ID)
  if (slug.length > 60) {
    const truncated = slug.substring(0, 60);
    // Try to cut at hyphen
    const lastHyphen = truncated.lastIndexOf('-');
    if (lastHyphen > 30) {
      slug = truncated.substring(0, lastHyphen);
    } else {
      slug = truncated;
    }
  }

  return slug;
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
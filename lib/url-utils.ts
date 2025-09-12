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
 * Convert Chinese characters to pinyin (simplified)
 */
function chineseToPinyin(text: string): string {
  // Basic pinyin mapping for common characters
  const pinyinMap: Record<string, string> = {
    '中': 'zhong', '国': 'guo', '人': 'ren', '大': 'da', '小': 'xiao', '好': 'hao', '不': 'bu', '是': 'shi', '的': 'de', '了': 'le',
    '在': 'zai', '有': 'you', '我': 'wo', '他': 'ta', '她': 'ta', '它': 'ta', '们': 'men', '这': 'zhe', '那': 'na', '个': 'ge',
    '上': 'shang', '下': 'xia', '来': 'lai', '去': 'qu', '出': 'chu', '到': 'dao', '时': 'shi', '年': 'nian', '月': 'yue', '日': 'ri',
    '天': 'tian', '地': 'di', '水': 'shui', '火': 'huo', '木': 'mu', '金': 'jin', '土': 'tu', '山': 'shan', '海': 'hai', '河': 'he',
    '新': 'xin', '老': 'lao', '高': 'gao', '低': 'di', '长': 'chang', '短': 'duan', '多': 'duo', '少': 'shao', '快': 'kuai', '慢': 'man',
    '开': 'kai', '关': 'guan', '看': 'kan', '听': 'ting', '说': 'shuo', '读': 'du', '写': 'xie', '学': 'xue', '教': 'jiao', '工': 'gong',
    '作': 'zuo', '生': 'sheng', '活': 'huo', '家': 'jia', '公': 'gong', '司': 'si', '校': 'xiao', '医': 'yi', '院': 'yuan',
    '技': 'ji', '术': 'shu', '科': 'ke', '研': 'yan', '发': 'fa', '展': 'zhan', '经': 'jing', '济': 'ji', '政': 'zheng', '治': 'zhi',
    '文': 'wen', '化': 'hua', '社': 'she', '会': 'hui', '网': 'wang', '络': 'luo', '信': 'xin', '息': 'xi', '数': 'shu', '据': 'ju',
    '智': 'zhi', '能': 'neng', '机': 'ji', '器': 'qi', '习': 'xi', '深': 'shen', '度': 'du'
  }
  
  return text.split('').map(char => pinyinMap[char] || char).join('')
}

/**
 * Convert Japanese characters to romaji (simplified)
 */
function japaneseToRomaji(text: string): string {
  // Basic hiragana/katakana to romaji mapping
  const romajiMap: Record<string, string> = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'wo', 'ん': 'n',
    // Katakana
    'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
    'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
    'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
    'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
    'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
    'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
    'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
    'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
    'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
    'ワ': 'wa', 'ヰ': 'wi', 'ヱ': 'we', 'ヲ': 'wo', 'ン': 'n'
  }
  
  return text.split('').map(char => romajiMap[char] || char).join('')
}

/**
 * Convert Korean characters to latin (simplified)
 */
function koreanToLatin(text: string): string {
  // Basic Korean consonants and vowels mapping
  const koreanMap: Record<string, string> = {
    'ㄱ': 'g', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄹ': 'r', 'ㅁ': 'm', 'ㅂ': 'b', 'ㅅ': 's', 'ㅇ': '', 'ㅈ': 'j', 'ㅊ': 'ch', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h',
    'ㅏ': 'a', 'ㅑ': 'ya', 'ㅓ': 'eo', 'ㅕ': 'yeo', 'ㅗ': 'o', 'ㅛ': 'yo', 'ㅜ': 'u', 'ㅠ': 'yu', 'ㅡ': 'eu', 'ㅣ': 'i'
  }
  
  // Simple decomposition for common syllables
  const syllableMap: Record<string, string> = {
    '한': 'han', '국': 'guk', '사': 'sa', '람': 'ram', '회': 'hoe', '기': 'gi', '업': 'eop', '학': 'hak', '교': 'gyo',
    '정': 'jeong', '부': 'bu', '시': 'si', '장': 'jang', '도': 'do', '서': 'seo', '울': 'ul', '산': 'san', '대': 'dae',
    '구': 'gu', '인': 'in', '천': 'cheon', '광': 'gwang', '주': 'ju', '전': 'jeon'
  }
  
  return text.split('').map(char => syllableMap[char] || koreanMap[char] || char).join('')
}

/**
 * Transliterate non-Latin scripts to ASCII
 */
function transliterate(text: string): string {
  // Apply script-specific conversions
  let result = text
  
  // Chinese to pinyin
  if (/[\u4e00-\u9fff]/.test(result)) {
    result = chineseToPinyin(result)
  }
  
  // Japanese to romaji
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(result)) {
    result = japaneseToRomaji(result)
  }
  
  // Korean to latin
  if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(result)) {
    result = koreanToLatin(result)
  }
  
  // Remove accents and normalize
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  return result
}

/**
 * Extract keywords from title for fallback slug
 */
function extractKeywords(title: string, count: number = 3): string[] {
  const words = title.toLowerCase().split(/\s+/)
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'hers'])
  
  const keywords = words
    .filter(word => word.length > 2 && !stopwords.has(word))
    .map(word => word.replace(/[^a-z0-9]/g, ''))
    .filter(word => word.length > 1)
    .slice(0, count)
  
  return keywords
}

/**
 * Generate a URL-friendly slug from article title
 * Implements robust fallback chain to avoid empty/meaningless title parts
 */
export function generateSlugFromTitle(title: string, category?: string): string {
  const nowFallback = () => {
    const d = new Date()
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return category ? `post-${category}-${y}${m}${day}` : `post-${y}${m}${day}`
  }

  if (!title || title.trim().length === 0) {
    return nowFallback()
  }

  // Base cleaning: strip HTML tags, emoji, control chars
  const raw = title
    .replace(/<[^>]*>/g, ' ') // strip HTML
    .replace(/[\u0000-\u001F\u007F]+/g, ' ') // control chars
    .replace(/[\u{1F000}-\u{1FAFF}\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, ' ') // emoji
    .replace(/\s+/g, ' ')
    .trim()

  // Step 1: Try transliteration for non-Latin scripts
  const transliterated = transliterate(raw)
  
  // Step 2: Extract ASCII tokens
  const stopwords = new Set([
    'a','an','the','of','and','or','for','to','in','on','at','by','with','from','as','is','are','was','were','be','been','being','that','this','these','those','it','its','into','over','about'
  ])
  
  const whitelist = new Set(['ai','gpt','openai','llm','ml','nlp','cv','web3','solana','ethereum','eth','token','api','sdk','ios','android','node','nextjs','react','vite','rust','go','python'])
  
  const normalizeLatin = (text: string) => {
    const lowered = text
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
    const tokens = (lowered.match(/[a-z0-9]+/g) || [])
    const kept = tokens.filter(t => t.length > 1 && (whitelist.has(t) || !stopwords.has(t)))
    return kept
  }
  
  let tokens = normalizeLatin(transliterated)
  
  // Step 3: If no good tokens, try keyword extraction
  if (tokens.length === 0) {
    const keywords = extractKeywords(raw)
    if (keywords.length > 0) {
      tokens = keywords
    }
  }
  
  // Step 4: Build slug candidate
  let slug = tokens.join('-')
  
  // Step 5: Final fallbacks
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
 * Generate a URL-friendly slug from article title
 */
export function generateArticleSlug(title: string, category?: string): string {
  return generateSlugFromTitle(title, category)
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
 * Generate article URL with date-based structure
 * Format: /{lang}/article/{YYYY}/{MM}/{DD}/{title-slug--shortId}
 */
export function generateArticleUrl(title: string, id: string, publishedAt: string | Date, lang: string = 'en'): string {
  const titleSlug = generateSlugFromTitle(title)
  const shortId = generateShortId(id)
  const date = new Date(publishedAt)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  
  return `/${lang}/article/${year}/${month}/${day}/${titleSlug}--${shortId}`
}

/**
 * Generate legacy article URL (for redirects)
 * Format: /article/title-slug--shortId
 */
export function generateLegacyArticleUrl(title: string, id: string): string {
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
export function generateShareableUrl(title: string, id: string, publishedAt: string | Date, lang: string = 'en', baseUrl?: string): string {
  const articlePath = generateArticleUrl(title, id, publishedAt, lang)
  const domain = baseUrl || 'https://www.xarticle.news'
  return `${domain}${articlePath}`
}

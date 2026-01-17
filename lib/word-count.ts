/**
 * Word count utility for multilingual content
 * Handles English, Chinese (simplified & traditional), and mixed content
 */

/**
 * Comprehensive CJK (Chinese, Japanese, Korean) Unicode ranges
 * Includes:
 * - CJK Unified Ideographs (基本汉字)
 * - CJK Unified Ideographs Extension A-G (扩展汉字区)
 * - CJK Compatibility Ideographs (兼容汉字)
 * - CJK Radicals (部首)
 * - CJK Symbols and Punctuation (CJK符号和标点)
 */
const CJK_RANGES: Array<[number, number]> = [
  // CJK Unified Ideographs (基本汉字)
  [0x4e00, 0x9fff],
  // CJK Unified Ideographs Extension A (扩展A区)
  [0x3400, 0x4dbf],
  // CJK Compatibility Ideographs (兼容汉字)
  [0xf900, 0xfaff],
  // CJK Radicals Supplement (部首补充)
  [0x2e80, 0x2eff],
  // CJK Symbols and Punctuation (CJK符号和标点)
  [0x3000, 0x303f],
  // CJK Strokes (笔画)
  [0x31c0, 0x31ef],
  // Ideographic Description Characters (表意文字描述字符)
  [0x2ff0, 0x2fff],
]

/**
 * Regex pattern to match all CJK characters
 */
const CJK_PATTERN = new RegExp(
  CJK_RANGES.map(([start, end]) => {
    const hexStart = start.toString(16).padStart(4, '0')
    const hexEnd = end.toString(16).padStart(4, '0')
    return `\\u${hexStart}-\\u${hexEnd}`
  }).join('|'),
  'gu'
)

/**
 * Simplified CJK pattern for performance (covers 99%+ of usage)
 * Includes basic CJK Unified Ideographs + Extension A + common symbols
 */
const CJK_SIMPLE_PATTERN = /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f]/gu

/**
 * Count words in multilingual text
 *
 * Rules:
 * - Each CJK character counts as 1 "word"
 * - English/other Latin words are split by whitespace and punctuation
 * - Numbers are counted as separate tokens
 *
 * @param text - The text to count
 * @returns The word count
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0
  }

  // Remove HTML tags if present
  const cleanText = text.replace(/<[^>]*>/g, ' ')

  // Count CJK characters
  const cjkMatches = cleanText.match(CJK_SIMPLE_PATTERN)
  const cjkCount = cjkMatches ? cjkMatches.length : 0

  // For non-CJK content, count words by splitting on whitespace and punctuation
  // Remove CJK characters first, then split
  const nonCjkText = cleanText.replace(CJK_SIMPLE_PATTERN, ' ')

  // Split by whitespace and filter out empty strings
  const words = nonCjkText
    .split(/[\s\n\r\t]+/)
    .filter(w => w.trim().length > 0)

  // Count words (alphanumeric sequences)
  // Each sequence of letters/numbers counts as one word
  const latinWordCount = words.reduce((count, word) => {
    // Count sequences of alphanumeric characters as words
    const matches = word.match(/[a-zA-Z0-9]+/g)
    return count + (matches ? matches.length : 0)
  }, 0)

  return cjkCount + latinWordCount
}

/**
 * Get detailed word count statistics
 */
export interface WordCountStats {
  total: number
  cjk: number
  latin: number
  cjkPercentage: number
}

/**
 * Get detailed word count statistics for a text
 */
export function getWordCountStats(text: string): WordCountStats {
  if (!text || text.trim().length === 0) {
    return { total: 0, cjk: 0, latin: 0, cjkPercentage: 0 }
  }

  const cleanText = text.replace(/<[^>]*>/g, ' ')

  const cjkMatches = cleanText.match(CJK_SIMPLE_PATTERN)
  const cjkCount = cjkMatches ? cjkMatches.length : 0

  const nonCjkText = cleanText.replace(CJK_SIMPLE_PATTERN, ' ')
  const words = nonCjkText.split(/[\s\n\r\t]+/).filter(w => w.trim().length > 0)

  const latinWordCount = words.reduce((count, word) => {
    const matches = word.match(/[a-zA-Z0-9]+/g)
    return count + (matches ? matches.length : 0)
  }, 0)

  const total = cjkCount + latinWordCount
  const cjkPercentage = total > 0 ? (cjkCount / total) * 100 : 0

  return {
    total,
    cjk: cjkCount,
    latin: latinWordCount,
    cjkPercentage: Math.round(cjkPercentage),
  }
}

/**
 * Determine if text should have a summary based on word count
 */
export interface SummaryRequirement {
  shouldSkip: boolean
  targetLength: string
  category: 'short' | 'medium' | 'long'
}

export function getSummaryRequirement(wordCount: number): SummaryRequirement {
  if (wordCount < 100) {
    return {
      shouldSkip: true,
      targetLength: 'N/A',
      category: 'short',
    }
  } else if (wordCount <= 1500) {
    return {
      shouldSkip: false,
      targetLength: '100-200 words',
      category: 'medium',
    }
  } else {
    return {
      shouldSkip: false,
      targetLength: '250-500 words',
      category: 'long',
    }
  }
}

/**
 * Detect primary language of text
 */
export type Language = 'zh' | 'en' | 'mixed' | 'unknown'

export function detectLanguage(text: string): Language {
  const stats = getWordCountStats(text)

  if (stats.total === 0) return 'unknown'

  if (stats.cjkPercentage > 70) return 'zh'
  if (stats.cjkPercentage < 30) return 'en'
  return 'mixed'
}

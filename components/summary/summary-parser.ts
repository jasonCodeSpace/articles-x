import { useMemo } from 'react'
import type { SummaryJson } from './types'

/**
 * Extract JSON summaries from raw text
 * Best-effort parser for legacy format
 */
export function useSummaryParser(summaryContent: string) {
  return useMemo(() => {
    const result: { en: SummaryJson | null; zh: SummaryJson | null } = { en: null, zh: null }

    const tryParse = (s: string): SummaryJson | null => {
      try {
        return JSON.parse(s) as SummaryJson
      } catch {
        return null
      }
    }

    // 1) Prefer code-fenced blocks (```json ... ``` or ``` ... ```)
    const fenceRegex = /```(?:json|JSON)?\s*([\s\S]*?)\s*```/g
    const blocks: SummaryJson[] = []
    let m: RegExpExecArray | null
    while ((m = fenceRegex.exec(summaryContent)) !== null) {
      const candidate = tryParse(m[1])
      if (candidate) blocks.push(candidate)
    }

    // 2) If nothing matched, try to find the first JSON-looking region in plain text
    if (blocks.length === 0) {
      const start = summaryContent.indexOf('{')
      const end = summaryContent.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = tryParse(summaryContent.slice(start, end + 1))
        if (candidate) blocks.push(candidate)
      }
    }

    // Assign by language flag when possible
    for (const b of blocks) {
      if (b.lang === 'en' && !result.en) result.en = b
      if (b.lang === 'zh' && !result.zh) result.zh = b
    }

    // If no lang keys, assume first is English and second is Chinese
    if (blocks.length > 0 && !result.en) result.en = blocks[0]
    if (blocks.length > 1 && !result.zh) result.zh = blocks[1]

    return result
  }, [summaryContent])
}

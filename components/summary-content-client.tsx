'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'

interface SummarySection {
  watchlist?: string[]
  key_data_points?: string[]
  other_quick_reads?: string[]
  policy_media_security?: string[]
}

interface SummaryJson {
  date: string
  lang: string
  meta: {
    notes: string
    domains_covered: string[]
  }
  counts: {
    articles_total: number
  }
  sections: SummarySection
}

interface DailySummary {
  id: string
  date: string
  summary_content: string
  summary_json_en: SummaryJson | null
  summary_json_zh: SummaryJson | null
  top_article_title: string
  top_article_id: string | null
  total_articles_count: number
  categories_summary: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export function SummaryContentClient({ summary }: { summary: DailySummary }) {
  // Sync with global language preference (en | original)
  const { language: globalLang, setLanguage: setGlobalLanguage } = useLanguage()
  const [language, setLanguage] = useState<'en' | 'zh'>(globalLang === 'en' ? 'en' : 'zh')
  const searchParams = useSearchParams()

  useEffect(() => {
    setLanguage(globalLang === 'en' ? 'en' : 'zh')
  }, [globalLang])

  // Initialize from URL param ?lang=en|zh if provided
  useEffect(() => {
    const param = (searchParams?.get('lang') || '').toLowerCase()
    if (param === 'en' || param === 'zh') {
      setLanguage(param)
      try { setGlobalLanguage(param === 'en' ? 'en' : 'original') } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'zh' : 'en'
      // Write back to global provider if present
      try { setGlobalLanguage(next === 'en' ? 'en' : 'original') } catch {}
      return next
    })
  }

  // Best-effort parser to extract JSON summaries from raw text
  const extractedFromContent = useMemo(() => {
    const text = summary.summary_content || ''
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
    while ((m = fenceRegex.exec(text)) !== null) {
      const candidate = tryParse(m[1])
      if (candidate) blocks.push(candidate)
    }

    // 2) If nothing matched, try to find the first JSON-looking region in plain text
    if (blocks.length === 0) {
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = tryParse(text.slice(start, end + 1))
        if (candidate) blocks.push(candidate)
      }
    }

    // Assign by language flag when possible
    for (const b of blocks) {
      if ((b as any).lang === 'en' && !result.en) result.en = b
      if ((b as any).lang === 'zh' && !result.zh) result.zh = b
    }

    // If no lang keys, assume first is English and second is Chinese
    if (blocks.length > 0 && !result.en) result.en = blocks[0]
    if (blocks.length > 1 && !result.zh) result.zh = blocks[1]

    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.summary_content])
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Prefer server-provided JSON; fallback to parsed-from-text
  // Primary: only use JSON from Supabase columns. If both missing, fallback to
  // best-effort extraction from summary_content.
  const summaryEn = summary.summary_json_en || null
  const summaryZh = summary.summary_json_zh || null
  const selectedSummaryJsonDirect = language === 'en' ? summaryEn : summaryZh
  const alternateSummaryJsonDirect = language === 'en' ? summaryZh : summaryEn
  const bothMissing = !summaryEn && !summaryZh
  const fallbackEn = extractedFromContent.en
  const fallbackZh = extractedFromContent.zh
  const selectedSummaryJsonFallback = language === 'en' ? fallbackEn : fallbackZh
  const shouldUseAlternate = !selectedSummaryJsonDirect && !!alternateSummaryJsonDirect
  const currentSummaryJson =
    selectedSummaryJsonDirect ||
    (shouldUseAlternate ? alternateSummaryJsonDirect : null) ||
    (bothMissing ? selectedSummaryJsonFallback : null)
  const hasJsonData = !!(currentSummaryJson && Object.keys(currentSummaryJson).length > 0)
  const showSwitchNotice = !selectedSummaryJsonDirect && !!alternateSummaryJsonDirect

  const timeAgo = formatDistanceToNow(new Date(summary.created_at), {
    addSuffix: true,
    locale: enUS
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Daily Summary</h1>
          <p className="text-muted-foreground mb-4">{formatDate(summary.date)}</p>
        </div>
        
        {/* Author, Time Info and Language Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex shrink-0 overflow-hidden rounded-full h-6 w-6 ring-1 ring-border">
              <Image 
                className="aspect-square h-full w-full" 
                alt="xarticle profile picture" 
                width={24}
                height={24}
                src="/logo.svg"
              />
            </span>
            <Link 
              href="/summaries"
              className="font-medium text-muted-foreground truncate hover:text-foreground transition-colors"
            >
              @xarticle
            </Link>
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-4">
              <span>·</span>
              <time>{timeAgo}</time>
            </div>
          </div>
          
          {/* Single toggle button: EN <-> 中文 */}
          <button
            onClick={toggleLanguage}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:bg-accent transition-colors cursor-pointer select-none"
            aria-label={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
            title={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
            data-testid="summary-language-toggle"
          >
            {language === 'en' ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 8l6 6"/>
                  <path d="M4 14l6-6 2-3"/>
                  <path d="M2 5h12"/>
                  <path d="M7 2h1"/>
                  <path d="M22 22l-5-10-5 10"/>
                  <path d="M14 18h6"/>
                </svg>
                English
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                中文
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {hasJsonData ? (
          <>
            <h2 className="sr-only">Daily Summary Overview</h2>
            {/* If selected language JSON is missing but the other exists, we render the alternate and show a notice */}
            {showSwitchNotice && (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  {language === 'zh' ? '中文版本暂不可用，已临时显示英文内容。' : 'English version unavailable; temporarily showing Chinese.'}
                </CardContent>
              </Card>
            )}
            {/* Article Count */}
            <Card>
              <CardHeader>
                <CardTitle>Articles Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {currentSummaryJson?.counts?.articles_total || summary.total_articles_count}
                </div>
                <p className="text-muted-foreground">articles from the past 24 hours</p>
              </CardContent>
            </Card>

            {/* Key Data Points */}
            {currentSummaryJson?.sections?.key_data_points && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Data Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    {currentSummaryJson.sections.key_data_points.map((point, index) => (
                      <li key={index}>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Watchlist */}
            {currentSummaryJson?.sections?.watchlist && (
              <Card>
                <CardHeader>
                  <CardTitle>Watchlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    {currentSummaryJson.sections.watchlist.map((item, index) => (
                      <li key={index}>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Policy, Media & Security */}
            {currentSummaryJson?.sections?.policy_media_security && (
              <Card>
                <CardHeader>
                  <CardTitle>Policy, Media & Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    {currentSummaryJson.sections.policy_media_security.map((item, index) => (
                      <li key={index}>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Other Quick Reads */}
            {currentSummaryJson?.sections?.other_quick_reads && (
              <Card>
                <CardHeader>
                  <CardTitle>Other Quick Reads</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    {currentSummaryJson.sections.other_quick_reads.map((item, index) => (
                      <li key={index}>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Domains Covered */}
            {currentSummaryJson?.meta?.domains_covered && (
              <Card>
                <CardHeader>
                  <CardTitle>Domains Covered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {currentSummaryJson.meta.domains_covered.map((domain, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          // Fallback to original layout
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{summary.summary_content}</p>
              </div>
            </CardContent>
          </Card>
        )}
         
         {/* Categories Summary - only show for fallback layout */}
        {!hasJsonData && summary.categories_summary && (
          <Card>
            <CardHeader>
              <CardTitle>Categories Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(summary.categories_summary as Record<string, number>).map(([category, count]) => (
                  <div key={category} className="text-center">
                    <div className="text-lg font-semibold">{count}</div>
                    <div className="text-xs text-muted-foreground capitalize">{category}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

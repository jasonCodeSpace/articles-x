'use client'
import { Card, CardContent } from '@/components/ui/card'
import { useSummaryLanguage } from './use-summary-language'
import { useSummaryParser } from './summary-parser'
import { SummaryHeader } from './summary-header'
import { SummarySections, FallbackContent } from './summary-sections'
import type { DailySummary, SummaryJson } from './types'

interface SummaryContentClientProps {
  summary: DailySummary
}

export function SummaryContentClient({ summary }: SummaryContentClientProps) {
  const { language, toggleLanguage } = useSummaryLanguage()
  const extractedFromContent = useSummaryParser(summary.summary_content || '')

  // Determine which summary to show
  const summaryEn = summary.summary_json_en || null
  const summaryZh = summary.summary_json_zh || null
  const selectedSummaryJsonDirect = language === 'en' ? summaryEn : summaryZh
  const alternateSummaryJsonDirect = language === 'en' ? summaryZh : summaryEn
  const bothMissing = !summaryEn && !summaryZh
  const fallbackEn = extractedFromContent.en
  const fallbackZh = extractedFromContent.zh
  const selectedSummaryJsonFallback = language === 'en' ? fallbackEn : fallbackZh
  const shouldUseAlternate = !selectedSummaryJsonDirect && !!alternateSummaryJsonDirect

  const currentSummaryJson: SummaryJson | null =
    selectedSummaryJsonDirect ||
    (shouldUseAlternate ? alternateSummaryJsonDirect : null) ||
    (bothMissing ? selectedSummaryJsonFallback : null)

  const hasJsonData = !!(currentSummaryJson && Object.keys(currentSummaryJson).length > 0)
  const showSwitchNotice = !selectedSummaryJsonDirect && !!alternateSummaryJsonDirect

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <SummaryHeader
          date={summary.date}
          createdAt={summary.created_at}
          language={language}
          onToggleLanguage={toggleLanguage}
        />
      </div>

      <div className="space-y-6">
        {hasJsonData ? (
          <>
            {showSwitchNotice && (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  {language === 'zh'
                    ? '中文版本暂不可用，已临时显示英文内容。'
                    : 'English version unavailable; temporarily showing Chinese.'}
                </CardContent>
              </Card>
            )}
            <SummarySections
              summaryJson={currentSummaryJson}
              totalArticlesCount={summary.total_articles_count}
            />
          </>
        ) : (
          <FallbackContent
            content={summary.summary_content}
            categoriesSummary={summary.categories_summary}
          />
        )}
      </div>
    </div>
  )
}

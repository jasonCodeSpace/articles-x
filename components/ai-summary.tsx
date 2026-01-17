'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from '@/lib/date-utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AiSummaryProps {
  summaryEnglish: string
  summaryChinese?: string
  summaryGeneratedAt?: string
}

export default function AiSummary({ 
  summaryEnglish, 
  summaryChinese, 
  summaryGeneratedAt 
}: AiSummaryProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [summaryLanguage, setSummaryLanguage] = useState<'en' | 'zh'>('en')
  const [formattedTime, setFormattedTime] = useState<string>('')
  
  // Use useEffect to calculate relative time on client side to avoid hydration mismatch
  useEffect(() => {
    if (summaryGeneratedAt) {
      setFormattedTime(formatDistanceToNow(new Date(summaryGeneratedAt), { addSuffix: true }))
    }
  }, [summaryGeneratedAt])
  
  const currentSummary = summaryLanguage === 'zh' ? (summaryChinese || summaryEnglish) : summaryEnglish
  

  
  return (
    <section className="mb-8 p-8 bg-muted rounded-xl border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-foreground tracking-tight">Summary</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSummaryLanguage(summaryLanguage === 'en' ? 'zh' : 'en')}
            className="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 bg-background border border-border hover:bg-accent hover:text-accent-foreground shadow-sm"
          >
            {summaryLanguage === 'zh' ? '中文' : 'EN'}
          </button>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-accent rounded-lg"
            aria-label={isCollapsed ? 'Expand summary' : 'Collapse summary'}
          >
            {isCollapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Collapsible content */}
      {!isCollapsed && (
        <>
          <div className="article-content text-foreground">
             <div 
               dangerouslySetInnerHTML={{
                 __html: currentSummary
                   .replace(/\n\n/g, '</p><p>')
                   .replace(/\n/g, '<br />')
                   .replace(/^/, '<p>')
                   .replace(/$/, '</p>')
               }}
             />
           </div>
          
          {summaryGeneratedAt && (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Summary generated {formattedTime}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
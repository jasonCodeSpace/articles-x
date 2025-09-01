'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
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
  
  const currentSummary = summaryLanguage === 'zh' ? (summaryChinese || summaryEnglish) : summaryEnglish
  
  const _toggleSummaryLanguage = () => {
    setSummaryLanguage(summaryLanguage === 'en' ? 'zh' : 'en')
  }
  
  return (
    <section className="mb-8 p-8 bg-muted rounded-xl border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-lg">
            AI
          </span>
          <h3 className="text-xl font-semibold text-foreground tracking-tight">Summary</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setSummaryLanguage('en')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                summaryLanguage === 'en'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setSummaryLanguage('zh')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                summaryLanguage === 'zh'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              中文
            </button>
          </div>
          
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
                Summary generated {formatDistanceToNow(new Date(summaryGeneratedAt), { addSuffix: true })}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
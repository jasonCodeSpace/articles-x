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
  const [language, setLanguage] = useState<'en' | 'zh'>('en')
  const [isCollapsed, setIsCollapsed] = useState(true)
  
  const currentSummary = language === 'en' ? summaryEnglish : (summaryChinese || summaryEnglish)
  
  return (
    <section className="mb-6 p-6 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-xl font-semibold text-white hover:text-gray-200 transition-colors"
        >
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded">
            AI
          </span>
          Summary
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronUp className="h-5 w-5" />
          )}
        </button>
        
        {/* Language Toggle Buttons - only show when expanded */}
        {!isCollapsed && (
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                language === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              EN
            </button>
            {summaryChinese && (
              <button
                onClick={() => setLanguage('zh')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  language === 'zh'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                中文
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Collapsible content */}
      {!isCollapsed && (
        <>
          <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
            {currentSummary}
          </div>
          
          {summaryGeneratedAt && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                Summary generated {formatDistanceToNow(new Date(summaryGeneratedAt), { addSuffix: true })}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
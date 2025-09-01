'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, ChevronUp, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  
  const toggleSummaryLanguage = () => {
    setSummaryLanguage(summaryLanguage === 'en' ? 'zh' : 'en')
  }
  
  return (
    <section className="mb-8 p-8 bg-gray-900/30 rounded-xl border border-gray-600/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-lg">
            AI
          </span>
          <h3 className="text-xl font-semibold text-white tracking-tight">Summary</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-800/80 rounded-lg p-1">
            <button
              onClick={() => setSummaryLanguage('en')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                summaryLanguage === 'en'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setSummaryLanguage('zh')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                summaryLanguage === 'zh'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              中文
            </button>
          </div>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-400 hover:text-white transition-all duration-200 hover:bg-gray-700/50 rounded-lg"
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
          <div className="article-content text-gray-200">
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
            <div className="mt-6 pt-4 border-t border-gray-600/50">
              <p className="text-sm text-gray-400">
                Summary generated {formatDistanceToNow(new Date(summaryGeneratedAt), { addSuffix: true })}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
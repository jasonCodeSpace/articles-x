'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'

interface ArticleBreadcrumbProps {
  article: {
    title: string
    title_english?: string
  }
}

export function ArticleBreadcrumb({ article }: ArticleBreadcrumbProps) {
  const { language } = useLanguage()
  
  const displayTitle = language === 'en' ? (article.title_english || article.title) : article.title
  
  return (
    <nav className="mb-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/articles" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          <span>Articles</span>
        </Link>
        <span>/</span>
        <span className="text-white truncate">{displayTitle}</span>
      </div>
    </nav>
  )
}
'use client'

import { LanguageToggle } from '@/components/language-toggle'

export function ArticlePageToolbar() {
  return (
    <div className="mb-4 flex justify-end">
      <LanguageToggle />
    </div>
  )
}
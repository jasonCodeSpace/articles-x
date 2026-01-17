'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'

/**
 * Hook for managing summary language state
 * Syncs with global language preference and URL params
 */
export function useSummaryLanguage() {
  const { language: globalLang, setLanguage: setGlobalLanguage } = useLanguage()
  const [language, setLanguage] = useState<'en' | 'zh'>(globalLang === 'en' ? 'en' : 'zh')
  const searchParams = useSearchParams()

  // Sync with global language preference
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
  }, [searchParams, setGlobalLanguage])

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'zh' : 'en'
      try { setGlobalLanguage(next === 'en' ? 'en' : 'original') } catch {}
      return next
    })
  }

  return { language, toggleLanguage }
}

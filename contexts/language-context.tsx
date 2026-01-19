'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'original'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const [isHydrated, setIsHydrated] = useState(false)

  // Defer localStorage access until after hydration to prevent blocking
  useEffect(() => {
    // Run in next tick to avoid blocking initial render
    const timer = setTimeout(() => {
      setIsHydrated(true)
      try {
        const savedLanguage = localStorage.getItem('preferred-language') as Language
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'original')) {
          setLanguage(savedLanguage)
        }
      } catch {
        // Ignore localStorage errors
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  // Save language preference to localStorage when it changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('preferred-language', language)
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [language, isHydrated])

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
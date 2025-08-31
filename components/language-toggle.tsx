'use client'

import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'original' : 'en')
  }

  const currentLanguageLabel = language === 'en' ? 'English' : 'Original'

  return (
    <Button 
      variant="outline" 
      size="sm"
      className="gap-2 text-xs h-8 px-3"
      onClick={toggleLanguage}
    >
      <Languages className="h-3 w-3" />
      <span>{currentLanguageLabel}</span>
    </Button>
  )
}
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Article } from '@/components/article-card'

interface ArticleNavigationProps {
  previousArticle?: Article | null
  nextArticle?: Article | null
}

// Truncate title to first few words (max 40 characters)
function truncateTitle(title: string, maxChars = 40): string {
  if (title.length <= maxChars) return title
  const truncated = title.substring(0, maxChars)
  const lastSpace = truncated.lastIndexOf(' ')
  return truncated.substring(0, lastSpace > 0 ? lastSpace : maxChars) + '...'
}

export function ArticleNavigation({ previousArticle, nextArticle }: ArticleNavigationProps) {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys if no input/textarea is focused
      const activeElement = document.activeElement as HTMLElement
      const isInputFocused = activeElement?.tagName === 'INPUT' || 
                            activeElement?.tagName === 'TEXTAREA' ||
                            activeElement?.contentEditable === 'true'
      
      if (isInputFocused) return

      if (event.key === 'ArrowLeft' && previousArticle) {
        event.preventDefault()
        router.push(`/article/${previousArticle.slug}`)
      } else if (event.key === 'ArrowRight' && nextArticle) {
        event.preventDefault()
        router.push(`/article/${nextArticle.slug}`)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [previousArticle, nextArticle, router])

  const handlePreviousClick = () => {
    if (previousArticle) {
      router.push(`/article/${previousArticle.slug}`)
    }
  }

  const handleNextClick = () => {
    if (nextArticle) {
      router.push(`/article/${nextArticle.slug}`)
    }
  }

  // Don't render if no navigation options available
  if (!previousArticle && !nextArticle) {
    return null
  }

  return (
    <div className="flex justify-between items-center mt-12 pt-8 border-t border-border">
      {/* Previous Article */}
      <div className="flex-1">
        {previousArticle ? (
          <Button
            variant="ghost"
            onClick={handlePreviousClick}
            className="flex items-center gap-2 p-4 h-auto text-left hover:bg-accent/50 transition-colors group"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <div className="flex flex-col items-start">
              <span className="text-sm text-muted-foreground mb-1">Previous Article</span>
              <span className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                {truncateTitle(previousArticle.title_english || previousArticle.title)}
              </span>
            </div>
          </Button>
        ) : (
          <div></div>
        )}
      </div>

      {/* Next Article */}
      <div className="flex-1 flex justify-end">
        {nextArticle ? (
          <Button
            variant="ghost"
            onClick={handleNextClick}
            className="flex items-center gap-2 p-4 h-auto text-right hover:bg-accent/50 transition-colors group"
          >
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground mb-1">Next Article</span>
              <span className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                {truncateTitle(nextArticle.title_english || nextArticle.title)}
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Button>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface BookmarkButtonProps {
  articleId: string
  variant?: 'card' | 'page'
  className?: string
}

export function BookmarkButton({ articleId, variant = 'card', className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  // Check authentication and bookmark status on mount
  useEffect(() => {
    const checkUserAndBookmark = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Check if article is bookmarked
        const { data } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('article_id', articleId)
          .single()
        
        setIsBookmarked(!!data)
      }
    }

    checkUserAndBookmark()
  }, [articleId, supabase])

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login'
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          action: isBookmarked ? 'remove' : 'add'
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setIsBookmarked(result.bookmarked)
      } else {
        console.error('Bookmark error:', result.error)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === 'page') {
    return (
      <Button
        onClick={handleBookmark}
        variant={isBookmarked ? "default" : "outline"}
        disabled={isLoading}
        className={`gap-2 ${className}`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        ) : isBookmarked ? (
          <BookmarkCheck className="h-4 w-4" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </Button>
    )
  }

  // Card variant - smaller button
  return (
    <button
      onClick={handleBookmark}
      disabled={isLoading}
      className={`p-2 rounded-full transition-all duration-200 hover:bg-accent/50 ${
        isBookmarked 
          ? 'text-primary bg-primary/10' 
          : 'text-muted-foreground hover:text-foreground'
      } ${className}`}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : isBookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </button>
  )
}

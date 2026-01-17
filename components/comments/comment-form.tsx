'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommentSignIn } from './comment-states'
import { useRouter } from 'next/navigation'

interface CommentFormProps {
  user: { id: string; email?: string } | null
  articleId: string
  commentCount: number
  onSubmit: (content: string) => Promise<void>
  submitting: boolean
}

export function CommentForm({ user, articleId, commentCount, onSubmit, submitting }: CommentFormProps) {
  const [newComment, setNewComment] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    if (!newComment.trim() || !user || submitting) return
    const content = newComment.trim()
    setNewComment('')
    await onSubmit(content)
    // If there was an error, restore the content (handled by the parent)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!user) {
    return (
      <>
        <CommentSignIn />
        <div className="flex justify-center">
          <Button
            onClick={() => router.push('/login')}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Sign In
          </Button>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">
        Comments ({commentCount})
      </h3>

      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Share your thoughts..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none"
        rows={3}
        maxLength={1000}
        disabled={submitting}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/30">{newComment.length}/1000</span>
        <Button
          onClick={handleSubmit}
          disabled={!newComment.trim() || submitting}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>Posting...</>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Post Comment
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

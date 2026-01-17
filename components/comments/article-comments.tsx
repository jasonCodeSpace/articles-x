'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useComments } from './use-comments'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'
import { CommentEmpty, CommentLoading } from './comment-states'
import type { ArticleCommentsProps } from './types'

export function ArticleComments({ articleId }: ArticleCommentsProps) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [supabase])

  const { comments, loading, postComment, deleteComment } = useComments({ articleId })

  const handleSubmit = async (content: string) => {
    setSubmitting(true)
    try {
      await postComment(content)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId)
  }

  const realCommentCount = comments.filter(c => !c.is_optimistic).length

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
        <CommentForm
          user={user}
          articleId={articleId}
          commentCount={realCommentCount}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <CommentLoading />
        ) : comments.length === 0 ? (
          <CommentEmpty />
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

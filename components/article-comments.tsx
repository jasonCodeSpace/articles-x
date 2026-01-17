'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Send, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  user_name: string
  user_handle?: string
  user_avatar?: string
  is_owner?: boolean
  is_optimistic?: boolean
}

interface ArticleCommentsProps {
  articleId: string
}

export function ArticleComments({ articleId }: ArticleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [supabase])

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        // Check if current user owns each comment
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        const commentsWithOwnership = data.map((comment: Comment) => ({
          ...comment,
          is_owner: comment.user_id === currentUser?.id
        }))
        // Merge with existing comments, replacing optimistic ones
        setComments((prev) => {
          const optimistic = prev.filter(c => c.is_optimistic)
          const real = commentsWithOwnership
          // Remove optimistic comments that have real equivalents
          const optimisticIds = new Set(real.map(c => c.id))
          const remainingOptimistic = optimistic.filter(c => !optimisticIds.has(c.id))
          return [...real, ...remainingOptimistic]
        })
      }
      setLoading(false)
    }

    fetchComments()

    // Real-time subscription for new comments
    const channel = supabase
      .channel(`comments:${articleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `article_id=eq.${articleId}`
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [articleId, supabase])

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return

    setSubmitting(true)
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    // Get user profile data
    let userName = 'Anonymous'
    let userHandle: string | undefined
    let userAvatar: string | undefined

    if (currentUser?.user_metadata) {
      userName = currentUser.user_metadata.name || currentUser.user_metadata.full_name || currentUser.email?.split('@')[0] || 'Anonymous'
      userHandle = currentUser.user_metadata.user_name
      userAvatar = currentUser.user_metadata.avatar_url
    }

    // Create optimistic comment
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticComment: Comment = {
      id: optimisticId,
      content: newComment.trim(),
      created_at: new Date().toISOString(),
      user_id: currentUser?.id || '',
      user_name: userName,
      user_handle: userHandle,
      user_avatar: userAvatar,
      is_owner: true,
      is_optimistic: true
    }

    // Immediately add the comment to the list
    setComments((prev) => [...prev, optimisticComment])
    const commentContent = newComment.trim()
    setNewComment('')

    // Actually post the comment
    const { data, error } = await supabase
      .from('comments')
      .insert({
        article_id: articleId,
        user_id: currentUser?.id,
        user_name: userName,
        user_handle: userHandle,
        user_avatar: userAvatar,
        content: commentContent
      })
      .select()
      .single()

    if (error) {
      console.error('Error posting comment:', error)
      // Remove optimistic comment on error
      setComments((prev) => prev.filter(c => c.id !== optimisticId))
      setNewComment(commentContent) // Restore the comment text
    } else if (data) {
      // Replace optimistic comment with real one
      setComments((prev) => prev.map(c =>
        c.id === optimisticId
          ? { ...data, is_owner: true, is_optimistic: false }
          : c
      ))
    }

    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    // Optimistically remove the comment
    setComments((prev) => prev.filter(c => c.id !== commentId))

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      // Restore the comment on error
      // Note: in production you'd want to store the deleted comment to restore it
    }
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const commentDate = new Date(date)
    const diffInMs = now.getTime() - commentDate.getTime()
    const diffInMins = Math.floor(diffInMs / 60000)
    const diffInHours = Math.floor(diffInMs / 3600000)
    const diffInDays = Math.floor(diffInMs / 86400000)

    if (diffInMins < 1) return 'just now'
    if (diffInMins < 60) return `${diffInMins}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    return commentDate.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 mb-4">
          Comments ({comments.filter(c => !c.is_optimistic).length})
        </h3>

        {user ? (
          <div className="space-y-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none"
              rows={3}
              maxLength={1000}
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
        ) : (
          <div className="text-center py-6">
            <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm mb-4">Sign in to join the discussion</p>
            <Button
              onClick={() => router.push('/login')}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Sign In
            </Button>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white/50 mx-auto"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors ${comment.is_optimistic ? 'opacity-70' : ''}`}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                  {comment.user_avatar ? (
                    <Image
                      src={comment.user_avatar}
                      alt={comment.user_name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white/40" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white/80 text-sm">{comment.user_name}</span>
                      {comment.user_handle && (
                        <span className="text-xs text-white/30">@{comment.user_handle}</span>
                      )}
                      <span className="text-xs text-white/30">•</span>
                      <span className="text-xs text-white/30">{formatTime(comment.created_at)}</span>
                      {comment.is_optimistic && (
                        <span className="text-xs text-blue-400">sending...</span>
                      )}
                    </div>
                    {comment.is_owner && !comment.is_optimistic && (
                      <Button
                        onClick={() => handleDelete(comment.id)}
                        variant="ghost"
                        className="h-6 w-6 p-0 text-white/30 hover:text-red-400 hover:bg-transparent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

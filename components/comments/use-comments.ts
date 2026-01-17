'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Comment } from './types'

interface UseCommentsOptions {
  articleId: string
}

interface UseCommentsReturn {
  comments: Comment[]
  loading: boolean
  postComment: (content: string) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
}

export function useComments({ articleId }: UseCommentsOptions): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch comments
  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      const { data: { user } } = await supabase.auth.getUser()
      const commentsWithOwnership = data.map((comment: Comment) => ({
        ...comment,
        is_owner: comment.user_id === user?.id
      }))

      setComments((prev) => {
        const optimistic = prev.filter(c => c.is_optimistic)
        const real = commentsWithOwnership
        const optimisticIds = new Set(real.map(c => c.id))
        const remainingOptimistic = optimistic.filter(c => !optimisticIds.has(c.id))
        return [...real, ...remainingOptimistic]
      })
    }
    setLoading(false)
  }, [articleId, supabase])

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchComments()

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
  }, [articleId, supabase, fetchComments])

  // Post comment
  const postComment = useCallback(async (content: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let userName = 'Anonymous'
    let userHandle: string | undefined
    let userAvatar: string | undefined

    if (user.user_metadata) {
      userName = user.user_metadata.name || user.user_metadata.full_name || user.email?.split('@')[0] || 'Anonymous'
      userHandle = user.user_metadata.user_name
      userAvatar = user.user_metadata.avatar_url
    }

    // Create optimistic comment
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticComment: Comment = {
      id: optimisticId,
      content,
      created_at: new Date().toISOString(),
      user_id: user.id,
      user_name: userName,
      user_handle: userHandle,
      user_avatar: userAvatar,
      is_owner: true,
      is_optimistic: true
    }

    setComments((prev) => [...prev, optimisticComment])

    const { data, error } = await supabase
      .from('comments')
      .insert({
        article_id: articleId,
        user_id: user.id,
        user_name: userName,
        user_handle: userHandle,
        user_avatar: userAvatar,
        content
      })
      .select()
      .single()

    if (error) {
      console.error('Error posting comment:', error)
      setComments((prev) => prev.filter(c => c.id !== optimisticId))
      throw error
    } else if (data) {
      setComments((prev) => prev.map(c =>
        c.id === optimisticId
          ? { ...data, is_owner: true, is_optimistic: false }
          : c
      ))
    }
  }, [articleId, supabase])

  // Delete comment
  const deleteComment = useCallback(async (commentId: string) => {
    setComments((prev) => prev.filter(c => c.id !== commentId))

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      throw error
    }
  }, [supabase])

  return {
    comments,
    loading,
    postComment,
    deleteComment
  }
}

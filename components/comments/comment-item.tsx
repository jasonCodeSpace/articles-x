import Image from 'next/image'
import { User, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Comment } from './types'
import { formatCommentTime } from './utils'

interface CommentItemProps {
  comment: Comment
  onDelete: (id: string) => void
}

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  return (
    <div className={`p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors ${comment.is_optimistic ? 'opacity-70' : ''}`}>
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
              <span className="text-xs text-white/30">{formatCommentTime(comment.created_at)}</span>
              {comment.is_optimistic && (
                <span className="text-xs text-blue-400">sending...</span>
              )}
            </div>
            {comment.is_owner && !comment.is_optimistic && (
              <Button
                onClick={() => onDelete(comment.id)}
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
  )
}

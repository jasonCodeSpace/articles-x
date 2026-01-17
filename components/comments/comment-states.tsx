import { MessageSquare } from 'lucide-react'

interface CommentEmptyProps {
  message?: string
}

export function CommentEmpty({ message = 'No comments yet. Be the first to share your thoughts!' }: CommentEmptyProps) {
  return (
    <div className="text-center py-8">
      <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-3" />
      <p className="text-white/30 text-sm">{message}</p>
    </div>
  )
}

export function CommentLoading() {
  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white/50 mx-auto"></div>
    </div>
  )
}

export function CommentSignIn() {
  return (
    <div className="text-center py-6">
      <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-3" />
      <p className="text-white/50 text-sm mb-4">Sign in to join the discussion</p>
    </div>
  )
}

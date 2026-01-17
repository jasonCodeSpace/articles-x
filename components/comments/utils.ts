import { formatDistanceToNow } from 'date-fns'

export function formatCommentTime(date: string): string {
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

export function formatDistanceToNowCustom(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

// Main export
export { ArticleComments } from './article-comments'

// Sub-components
export { CommentItem } from './comment-item'
export { CommentForm } from './comment-form'
export { CommentEmpty, CommentLoading, CommentSignIn } from './comment-states'

// Hooks
export { useComments } from './use-comments'

// Types
export type { Comment, ArticleCommentsProps } from './types'

// Utils
export { formatCommentTime, formatDistanceToNowCustom } from './utils'

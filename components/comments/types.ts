export interface Comment {
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

export interface ArticleCommentsProps {
  articleId: string
}

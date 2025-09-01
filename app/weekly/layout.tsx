import { createClient } from '@/lib/supabase/server'
import { ModernNav } from '@/components/modern-nav'
import { getArticleCategories } from '@/lib/articles'

interface WeeklyLayoutProps {
  children: React.ReactNode
}

export default async function WeeklyLayout({ children }: WeeklyLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const categories = await getArticleCategories()

  const userForNav = user ? {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata
  } : undefined

  return (
    <>
      <ModernNav user={userForNav} categories={categories} />
      {children}
    </>
  )
}
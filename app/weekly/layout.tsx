import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { getArticleCategories } from '@/lib/articles'

interface WeeklyLayoutProps {
  children: React.ReactNode
}

export default async function WeeklyLayout({ children }: WeeklyLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const categories = await getArticleCategories()

  return (
    <>
      <ClientNavWrapper initialUser={user} categories={categories} />
      {children}
    </>
  )
}
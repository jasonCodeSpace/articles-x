import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'

interface CategoryLayoutProps {
  children: React.ReactNode
}

export default async function CategoryLayout({
  children,
}: CategoryLayoutProps) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Use fixed categories instead of fetching from database
  const categories = ['AI', 'Crypto', 'Tech', 'Data', 'Startups', 'Business', 'Markets', 'Product', 'Security', 'Policy', 'Science', 'Media']

  return (
    <div className="min-h-screen bg-background">
      <ClientNavWrapper initialUser={user} categories={categories} />
      
      {/* Main Content */}
      <div className="pt-20 md:pt-16 pb-20 md:pb-0">
        {children}
      </div>
    </div>
  )
}
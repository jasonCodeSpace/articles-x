import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default async function TrendingLayout({
  children,
}: ProtectedLayoutProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background">
      <ClientNavWrapper initialUser={user} />
      
      {/* Main Content */}
      <div className="pt-20 md:pt-16 pb-20 md:pb-0">
        {children}
      </div>
    </div>
  )
}
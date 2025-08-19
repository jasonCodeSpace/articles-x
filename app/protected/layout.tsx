import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-black">
      {/* X.com style header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 justify-between items-center">
            {/* Logo and brand */}
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-white/30 cursor-pointer">
                <span className="text-base font-black text-black group-hover:animate-pulse">𝕏</span>
              </div>
              <h1 className="text-xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors duration-300">articles</h1>
            </div>
            
            {/* User menu */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-900/50 transition-all duration-300 cursor-pointer group">
                <Avatar className="h-7 w-7 ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all duration-300">
                  <AvatarFallback className="text-xs font-semibold bg-gray-700 text-white group-hover:bg-blue-600 transition-colors duration-300">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-300 hidden sm:block group-hover:text-white transition-colors duration-300">
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content with X.com style layout */}
      <main className="mx-auto max-w-6xl px-4 py-0 relative overflow-hidden">
        {/* Ambient background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-purple-500/3 pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{animationDelay: '2s'}} />
        
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}
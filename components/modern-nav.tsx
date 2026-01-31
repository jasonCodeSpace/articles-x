"use client"

import React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { User, ChevronDown, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'


interface ModernNavProps {
  user?: {
    id: string
    email?: string
    user_metadata?: {
      avatar_url?: string
      full_name?: string
    }
  }
  categories?: string[]
  className?: string
}

export function ModernNav({ user, className }: ModernNavProps) {
  const router = useRouter()

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userInitial = userDisplayName.charAt(0).toUpperCase()

  const handleLogout = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      localStorage.clear()
      sessionStorage.clear()
      await supabase.auth.signOut({ scope: 'local' })
      window.location.replace('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      window.location.replace('/login')
    }
  }

  return (
    <nav className={cn("fixed top-0 left-0 right-0 z-50 flex justify-center p-6 pointer-events-none", className)}>
      <div className="flex items-center gap-2 bg-[#1A1A1A]/95 md:bg-[#1A1A1A]/80 backdrop-blur-none md:backdrop-blur-2xl border border-white/10 p-1.5 rounded-full shadow-2xl pointer-events-auto transition-all duration-500 hover:border-white/20">
        {/* Logo */}
        <Link href="/landing" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 transition-colors group">
          <Image src="/logo.svg" alt="Xarticle" width={20} height={20} className="invert opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300 group-hover:scale-110" />
        </Link>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Navigation Items */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push('/about')}
            className="px-4 py-2 text-[11px] font-medium tracking-widest uppercase text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/5"
          >
            About
          </button>

          <button
            onClick={() => router.push('/trending')}
            className="px-4 py-2 text-[11px] font-medium tracking-widest uppercase text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/5"
          >
            Trending
          </button>
        </div>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* User / Login */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-full hover:bg-white/5 transition-colors group">
                <Avatar className="w-7 h-7 border border-white/10">
                  {user?.user_metadata?.avatar_url && <AvatarImage src={user.user_metadata.avatar_url} />}
                  <AvatarFallback className="bg-white/5 text-white/50 text-[10px] font-bold">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown size={12} className="text-white/30 group-hover:text-white/50 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-4 border border-white/10 rounded-2xl p-2" style={{ backgroundColor: '#0A0A0A', opacity: 1 }}>
              <div className="px-3 py-2 mb-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-1">Authenticated as</p>
                <p className="text-sm font-medium text-white/90 truncate">{userDisplayName}</p>
              </div>
              <DropdownMenuItem onClick={() => router.push('/profile')} className="rounded-lg gap-3 py-2.5 text-white/70 hover:text-white hover:bg-white/5 cursor-pointer">
                <Settings size={16} className="opacity-50" />
                <span className="text-xs">Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg gap-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-400/5 cursor-pointer">
                <LogOut size={16} className="opacity-50" />
                <span className="text-xs">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 transition-colors group"
            title="Sign In"
          >
            <User size={20} className="text-white/50 group-hover:text-white transition-colors" />
          </button>
        )}
      </div>
    </nav>
  )
}
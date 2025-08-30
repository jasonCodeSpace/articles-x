"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Home, Search, User, BookOpen, Menu, Grid3X3, Bell, ChevronDown, Settings, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogoutButton } from '@/components/logout-button'
import { SearchComponent } from '@/components/search-component'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavItem {
  name: string
  url: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

interface ModernNavProps {
  user: {
    id: string
    email?: string
    user_metadata?: {
      avatar_url?: string
      full_name?: string
    }
  }
  categories: string[]
  className?: string
}

export function ModernNav({ user, categories, className }: ModernNavProps) {
  const [activeTab, setActiveTab] = useState("Home")
  const [isMobile, setIsMobile] = useState(false)

  const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const userInitial = userDisplayName.charAt(0).toUpperCase()

  const navItems: NavItem[] = [
    { name: 'Home', url: '/articles', icon: Home },
    { name: 'Categories', url: '#', icon: Filter },
    { name: 'Profile', url: '#', icon: User },
  ]

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <>
      {/* Mobile Search Bar - Top of page */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-gray-700/50 px-4 py-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search articles..."
            className="w-full bg-gray-800/50 border border-gray-600/50 rounded-full px-4 py-3 pl-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-1/2 -translate-x-1/2 z-50 mt-6">
        <div className="flex items-center gap-4 bg-black/80 border border-gray-700/50 backdrop-blur-lg py-3 px-6 rounded-full shadow-2xl">
          {/* Logo */}
          <Link href="/articles" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-300 group-hover:scale-110">
              <span className="text-xs font-black text-black">𝕏</span>
            </div>
            <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">articles</span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles..."
                className="bg-gray-800/50 border border-gray-600/50 rounded-full px-4 py-2 pl-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 w-64"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Categories */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="relative cursor-pointer text-sm font-semibold px-4 py-2 rounded-full transition-colors text-gray-400 hover:text-white hover:bg-gray-800/50"
                  onClick={() => setActiveTab('Categories')}
                >
                  <Filter size={18} strokeWidth={2.5} />
                  {activeTab === 'Categories' && (
                    <motion.div
                      layoutId="desktop-indicator"
                      className="absolute inset-0 w-full bg-blue-500/20 rounded-full -z-10"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-black/90 backdrop-blur-lg border-gray-700/50 mt-2">
                <DropdownMenuItem asChild>
                  <Link href="/articles" className="text-gray-300 hover:text-white hover:bg-gray-800/50 cursor-pointer">
                    All
                  </Link>
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem key={category} asChild>
                    <Link 
                      href={`/articles?category=${encodeURIComponent(category)}`}
                      className="text-gray-300 hover:text-white hover:bg-gray-800/50 cursor-pointer"
                    >
                      {category}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 hover:bg-gray-800/50 rounded-full p-2 transition-colors">
                  <Avatar className="w-6 h-6">
                    {user.user_metadata?.avatar_url ? (
                      <AvatarImage src={user.user_metadata.avatar_url} alt={userDisplayName} />
                    ) : null}
                    <AvatarFallback className="bg-gray-700/80 text-white text-xs font-medium">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white text-xs font-medium hidden lg:block">{userDisplayName}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-black/90 backdrop-blur-lg border-gray-700/50 mt-2">
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800/50 cursor-pointer">
                  <Settings size={16} className="mr-2" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-800/50 cursor-pointer">
                  <Bell size={16} className="mr-2" />
                  Subscribe
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                   <button 
                     onClick={async () => {
                       const { createClient } = await import('@/lib/supabase/client')
                       const supabase = createClient()
                       await supabase.auth.signOut()
                       window.location.href = '/login'
                     }}
                     className="w-full flex items-center justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 px-2 py-1.5 text-sm cursor-pointer"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                       <path d="m16 17 5-5-5-5"></path>
                       <path d="M21 12H9"></path>
                       <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                     </svg>
                     Logout
                   </button>
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Mobile Tubelight Navigation */}
      <div
        className={cn(
          "md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-50 mb-6",
          className,
        )}
      >
        <div className="flex items-center gap-2 bg-black/80 border border-gray-700/50 backdrop-blur-lg py-2 px-2 rounded-full shadow-2xl">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.name

            if (item.name === 'Categories') {
              return (
                <DropdownMenu key={item.name}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "relative cursor-pointer text-sm font-semibold px-4 py-2 rounded-full transition-colors",
                        "text-gray-400 hover:text-white",
                        isActive && "bg-gray-800/50 text-white",
                      )}
                      onClick={() => setActiveTab(item.name)}
                    >
                      <Icon size={18} strokeWidth={2.5} />
                      {isActive && (
                        <motion.div
                          layoutId="mobile-lamp"
                          className="absolute inset-0 w-full bg-blue-500/20 rounded-full -z-10"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-black/90 backdrop-blur-lg border-gray-700/50 mb-2">
                    <DropdownMenuItem asChild>
                      <Link href="/articles" className="text-gray-300 hover:text-white hover:bg-gray-800/50 cursor-pointer">
                        All
                      </Link>
                    </DropdownMenuItem>
                    {categories.map((category) => (
                      <DropdownMenuItem key={category} asChild>
                        <Link 
                          href={`/articles?category=${encodeURIComponent(category)}`}
                          className="text-gray-300 hover:text-white hover:bg-gray-800/50 cursor-pointer"
                        >
                          {category}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }

            return (
              <Link key={item.name} href={item.url}>
                <button
                  className={cn(
                    "relative cursor-pointer text-sm font-semibold px-4 py-2 rounded-full transition-colors",
                    "text-gray-400 hover:text-white",
                    isActive && "bg-gray-800/50 text-white",
                  )}
                  onClick={() => setActiveTab(item.name)}
                >
                  <Icon size={18} strokeWidth={2.5} />
                  {isActive && (
                    <motion.div
                      layoutId="mobile-lamp"
                      className="absolute inset-0 w-full bg-blue-500/20 rounded-full -z-10"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
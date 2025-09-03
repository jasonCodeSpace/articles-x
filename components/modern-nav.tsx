"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
// import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, ChevronDown, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'


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
  user?: {
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

export function ModernNav({ user, className }: ModernNavProps) {
  const [activeTab, setActiveTab] = useState("Home")
  // Theme functionality removed
  const router = useRouter()
  
  // Remove filter logic as we're replacing with Trending

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userInitial = userDisplayName.charAt(0).toUpperCase()

  const navItems: NavItem[] = [
    { name: 'Profile', url: '#', icon: User },
  ]

  return (
    <>


      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-1/2 -translate-x-1/2 z-50 mt-6">
        <div className="flex items-center gap-4 bg-background/70 backdrop-blur-md border border-border py-3 px-6 rounded-full shadow-2xl">
          {/* Logo */}
          <button onClick={() => router.push('/landing')} className="flex items-center gap-2 group cursor-pointer hover:cursor-pointer">
            <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center hover:bg-muted transition-all duration-300 group-hover:scale-110">
              <span className="text-xs font-black text-background">𝕏</span>
            </div>
            <span className="text-sm font-bold text-foreground group-hover:text-accent-foreground transition-colors">articles</span>
          </button>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {/* Trending Button */}
            <button 
              onClick={() => router.push('/trending')}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full transition-colors cursor-pointer"
            >
              Trending
            </button>

            
            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full transition-colors cursor-pointer">
                  Categories
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
                {['All Categories', 'AI', 'Crypto', 'Tech', 'Data', 'Startups', 'Business', 'Markets', 'Product', 'Security', 'Policy', 'Science', 'Media'].map((category) => (
                  <DropdownMenuItem key={category} asChild>
                    <button 
                      onClick={() => {
                        if (category === 'All Categories') {
                          router.push('/category/All')
                        } else {
                          router.push(`/category/${encodeURIComponent(category)}`)
                        }
                      }}
                      className="w-full cursor-pointer text-left"
                    >
                      {category}
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Dropdown or Login Button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-2 hover:bg-accent/50 rounded-full p-2 transition-colors cursor-pointer">
                    <Avatar className="w-6 h-6">
                      {user?.user_metadata?.avatar_url ? (
                        <AvatarImage src={user.user_metadata.avatar_url} alt={userDisplayName} />
                      ) : null}
                      <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground text-xs font-medium hidden lg:block">{userDisplayName}</span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="mt-2">
                  <DropdownMenuItem asChild>
                    <button 
                      onClick={() => router.push('/profile')}
                      className="w-full flex items-center justify-start cursor-pointer"
                    >
                      <Settings size={16} className="mr-2" />
                      Account
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-0">
                    <ThemeToggle />
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                     <button 
                       onClick={async () => {
                         try {
                           console.log('Logout button clicked')
                           const { createClient } = await import('@/lib/supabase/client')
                           const supabase = createClient()
                           
                           // Clear all local storage and session storage first
                           localStorage.clear()
                           sessionStorage.clear()
                           
                           // Try to sign out with timeout
                           const signOutPromise = supabase.auth.signOut({ scope: 'local' })
                           const timeoutPromise = new Promise((_, reject) => 
                             setTimeout(() => reject(new Error('Timeout')), 5000)
                           )
                           
                           try {
                             await Promise.race([signOutPromise, timeoutPromise])
                             console.log('Logout successful')
                           } catch (signOutError) {
                             console.warn('Sign out request failed or timed out:', signOutError)
                             // Continue with local logout
                           }
                           
                           // Force redirect regardless of sign out result
                           window.location.replace('/login')
                         } catch (error) {
                           console.error('Logout failed:', error)
                           // Clear storage anyway and redirect as fallback
                           localStorage.clear()
                           sessionStorage.clear()
                           window.location.replace('/login')
                         }
                       }}
                       className="w-full flex items-center justify-start px-2 py-1.5 text-sm cursor-pointer"
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
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-2 hover:bg-accent/50 rounded-full p-2 transition-colors cursor-pointer">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                        <User size={12} />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground text-xs font-medium hidden lg:block">Guest</span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="mt-2">
                  <DropdownMenuItem asChild>
                    <button 
                      onClick={() => router.push('/login')}
                      className="w-full flex items-center justify-start cursor-pointer"
                    >
                      <User size={16} className="mr-2" />
                      Login
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-0">
                    <ThemeToggle />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
             )}
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
        <div className="flex items-center gap-2 bg-background/70 backdrop-blur-md border border-border py-2 px-2 rounded-full shadow-2xl">
          {/* Mobile Logo */}
          <button onClick={() => router.push('/landing')} className="flex items-center gap-2 group cursor-pointer hover:cursor-pointer">
            <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center hover:bg-muted transition-all duration-300 group-hover:scale-110">
              <span className="text-xs font-black text-background">𝕏</span>
            </div>
            <span className="text-sm font-bold text-foreground group-hover:text-accent-foreground transition-colors">articles</span>
          </button>
          
          {/* Trending Button for Mobile */}
          <button 
            onClick={() => router.push('/trending')}
            className="relative cursor-pointer text-sm font-semibold px-4 py-2 rounded-full transition-colors text-muted-foreground hover:text-foreground"
            title="Trending"
          >
            Trending
          </button>
          
          {/* Category Dropdown for Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="relative cursor-pointer text-sm font-semibold px-4 py-2 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                title="Categories"
              >
                Category
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mb-2 w-48 max-h-60 overflow-y-auto">
              {['All Categories', 'AI', 'Crypto', 'Tech', 'Data', 'Startups', 'Business', 'Markets', 'Product', 'Security', 'Policy', 'Science', 'Media'].map((category) => (
                <DropdownMenuItem key={category} asChild>
                  <button 
                    onClick={() => {
                      if (category === 'All Categories') {
                        router.push('/category/All')
                      } else {
                        router.push(`/category/${encodeURIComponent(category)}`)
                      }
                    }}
                    className="w-full cursor-pointer text-left px-2 py-1.5 text-sm"
                  >
                    {category}
                  </button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.name

if (item.name === 'Profile') {
              if (user) {
                return (
                  <DropdownMenu key={item.name}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "relative cursor-pointer text-sm font-semibold px-4 py-2 rounded-full transition-colors",
                          "text-muted-foreground hover:text-foreground",
                          isActive && "bg-accent/50 text-foreground",
                        )}
                        onClick={() => setActiveTab(item.name)}
                      >
                        <Icon size={18} strokeWidth={2.5} />
                        {isActive && (
                          <motion.div
                            layoutId="mobile-lamp"
                            className="absolute inset-0 w-full bg-accent/20 rounded-full -z-10"
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
                    <DropdownMenuContent className="mt-2">
                      <DropdownMenuItem asChild>
                        <button 
                          onClick={() => router.push('/profile')}
                          className="w-full flex items-center justify-start text-popover-foreground hover:bg-accent cursor-pointer px-2 py-1.5 text-sm"
                        >
                          <Settings size={16} className="mr-2" />
                          Account
                        </button>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-popover-foreground hover:bg-accent p-0">
                        <ThemeToggle />
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                         <button 
                           onClick={async () => {
                             try {
                               console.log('Mobile logout button clicked')
                               const { createClient } = await import('@/lib/supabase/client')
                               const supabase = createClient()
                               
                               // Clear all local storage and session storage first
                               localStorage.clear()
                               sessionStorage.clear()
                               
                               // Try to sign out with timeout
                               const signOutPromise = supabase.auth.signOut({ scope: 'local' })
                               const timeoutPromise = new Promise((_, reject) => 
                                 setTimeout(() => reject(new Error('Timeout')), 5000)
                               )
                               
                               try {
                                 await Promise.race([signOutPromise, timeoutPromise])
                                 console.log('Mobile logout successful')
                               } catch (signOutError) {
                                 console.warn('Mobile sign out request failed or timed out:', signOutError)
                                 // Continue with local logout
                               }
                               
                               // Force redirect regardless of sign out result
                               window.location.replace('/login')
                             } catch (error) {
                               console.error('Mobile logout failed:', error)
                               // Clear storage anyway and redirect as fallback
                               localStorage.clear()
                               sessionStorage.clear()
                               window.location.replace('/login')
                             }
                           }}
                           className="w-full flex items-center justify-start text-popover-foreground hover:bg-accent px-2 py-1.5 text-sm cursor-pointer"
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
                )
              } else {
                return (
                  <DropdownMenu key={item.name}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "relative cursor-pointer text-sm font-semibold px-4 py-2 rounded-full transition-colors",
                          "text-muted-foreground hover:text-foreground",
                          isActive && "bg-accent/50 text-foreground",
                        )}
                        onClick={() => setActiveTab(item.name)}
                      >
                        <Icon size={18} strokeWidth={2.5} />
                        {isActive && (
                          <motion.div
                            layoutId="mobile-lamp"
                            className="absolute inset-0 w-full bg-accent/20 rounded-full -z-10"
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
                    <DropdownMenuContent className="mt-2">
                      <DropdownMenuItem asChild>
                        <button 
                          onClick={() => router.push('/login')}
                          className="w-full flex items-center justify-start text-popover-foreground hover:bg-accent cursor-pointer px-2 py-1.5 text-sm"
                        >
                          <User size={16} className="mr-2" />
                          Login
                        </button>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-popover-foreground hover:bg-accent p-0">
                        <ThemeToggle />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
            }

            return (
              <button
                key={item.name}
                className={cn(
                  "relative cursor-pointer text-sm font-semibold px-4 py-2 rounded-full transition-colors",
                  "text-muted-foreground hover:text-foreground",
                  isActive && "bg-accent/50 text-foreground",
                )}
                onClick={() => {
                  setActiveTab(item.name)
                  router.push(item.url)
                }}
              >
                <Icon size={18} strokeWidth={2.5} />
                {isActive && (
                  <motion.div
                    layoutId="mobile-lamp"
                    className="absolute inset-0 w-full bg-accent/20 rounded-full -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </>  
  )
}
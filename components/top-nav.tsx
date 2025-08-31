'use client'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogoutButton } from '@/components/logout-button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface TopNavProps {
  user: {
    id: string
    email?: string
    user_metadata?: {
      avatar_url?: string
      full_name?: string
    }
  }
  categories: string[]
}

export function TopNav({ user, categories }: TopNavProps) {
  const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const userInitial = userDisplayName.charAt(0).toUpperCase()

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link href="/articles" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-white/30">
              <span className="text-base font-black text-black group-hover:animate-pulse">𝕏</span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors duration-300">articles</h1>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            {/* SearchComponent removed */}
          </div>

          {/* Categories Dropdown */}
          <div className="hidden md:flex items-center gap-2 mr-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-transparent hover:bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-500 flex items-center gap-2"
                >
                  Categories
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-700 w-[280px] sm:w-[420px] max-h-[400px] overflow-y-auto p-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                  <DropdownMenuItem asChild>
                    <Link href="/articles" className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer text-sm px-2 py-1.5">
                      All
                    </Link>
                  </DropdownMenuItem>
                  {categories.map((category) => (
                    <DropdownMenuItem key={category} asChild>
                      <Link 
                        href={`/articles?category=${encodeURIComponent(category)}`}
                        className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer text-sm px-2 py-1.5"
                      >
                        {category}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            >
              Subscribe
            </Button>
            
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                {user.user_metadata?.avatar_url ? (
                  <AvatarImage src={user.user_metadata.avatar_url} alt={userDisplayName} />
                ) : null}
                <AvatarFallback className="bg-gray-700 text-white text-sm font-medium">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-sm font-medium hidden sm:block">{userDisplayName}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
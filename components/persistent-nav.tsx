'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PersistentNavProps {
  userInitials?: string
  userName?: string
}

export function PersistentNav({ userInitials = 'J', userName = 'jcwang0919' }: PersistentNavProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pt-4">
      <div className="flex items-center gap-4 bg-black/80 border border-gray-700/50 backdrop-blur-lg py-3 px-6 rounded-full shadow-2xl">
        {/* Logo/Brand */}
        <Link href="/articles" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-300 group-hover:scale-110">
            <span className="text-xs font-black text-black">𝕏</span>
          </div>
          <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
            articles
          </span>
        </Link>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 hover:bg-gray-800/50 rounded-full p-2 transition-colors">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-gray-700/80 text-white text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white text-xs font-medium hidden lg:block">
                  {userName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-gray-900 border-gray-700 rounded-xl">
              <DropdownMenuItem className="rounded-lg">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
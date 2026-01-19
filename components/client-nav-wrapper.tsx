'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { ModernNav } from './modern-nav'

interface ClientNavWrapperProps {
  initialUser?: User | null
  categories?: string[]
}

export function ClientNavWrapper({ initialUser, categories }: ClientNavWrapperProps) {
  const [user, setUser] = useState<User | null>(initialUser || null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Get current user on mount - non-blocking
    const getCurrentUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch {
        // Silently fail - show nav without user
        setUser(null)
      }
    }

    getCurrentUser()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)

      if (event === 'SIGNED_OUT') {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('supabase.auth.token')
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear()
          }
        } catch {
          // Ignore storage errors
        }

        const currentPath = window.location.pathname
        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/landing') {
          window.location.replace('/login')
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Always render nav immediately
  return <ModernNav user={user ? {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata
  } : undefined} categories={categories} />
}

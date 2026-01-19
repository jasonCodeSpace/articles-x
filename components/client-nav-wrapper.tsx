'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { ModernNav } from './modern-nav'

interface ClientNavWrapperProps {
  initialUser?: User | null
  categories?: string[]
}

export function ClientNavWrapper({ initialUser, categories }: ClientNavWrapperProps) {
  const [user, setUser] = useState<User | null>(initialUser || null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    // Use transition to avoid blocking UI
    startTransition(() => {
      // Get current user on mount - with timeout protection
      const getCurrentUser = async () => {
        try {
          const supabase = createClient()
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth timeout')), 3000)
          )
          const { data: { user: currentUser } } = await Promise.race([
            supabase.auth.getUser(),
            timeoutPromise
          ]) as any
          setUser(currentUser)
        } catch (error) {
          // Silently fail - show nav without user
          setUser(null)
        }
      }

      getCurrentUser()
    })

    // Listen for auth changes - debounced
    let authTimer: NodeJS.Timeout | null = null
    try {
      const supabase = createClient()
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // Debounce rapid auth changes
        if (authTimer) clearTimeout(authTimer)
        authTimer = setTimeout(() => {
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
        }, 100)
      })

      return () => {
        if (authTimer) clearTimeout(authTimer)
        subscription.unsubscribe()
      }
    } catch {
      // If Supabase fails to initialize, just show nav without auth
      return
    }
  }, [])

  // Always render nav immediately, even during auth check
  return <ModernNav user={user ? {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata
  } : undefined} categories={categories} />
}

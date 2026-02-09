'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { ModernNav } from './modern-nav'

interface ClientNavWrapperProps {
  initialUser?: User | null
  categories?: string[]
}

// Simple user state shape to reduce payload
type SimpleUser = {
  id: string
  email?: string
  avatar_url?: string
  full_name?: string
} | null

export function ClientNavWrapper({ initialUser, categories }: ClientNavWrapperProps) {
  const [user, setUser] = useState<SimpleUser>(
    initialUser ? {
      id: initialUser.id,
      email: initialUser.email,
      avatar_url: initialUser.user_metadata?.avatar_url,
      full_name: initialUser.user_metadata?.full_name,
    } : null
  )

  // Use transition for non-critical auth state updates
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    // Non-blocking auth check
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setUser({
            id: user.id,
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url,
            full_name: user.user_metadata?.full_name,
          })
        }
      } catch {
        // Silently fail - show nav without user
      }
    })

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          avatar_url: session.user.user_metadata?.avatar_url,
          full_name: session.user.user_metadata?.full_name,
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <ModernNav user={user} categories={categories} />
}

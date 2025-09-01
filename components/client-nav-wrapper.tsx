'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ModernNav } from './modern-nav'
import { User } from '@supabase/supabase-js'

interface ClientNavWrapperProps {
  initialUser?: User | null
  categories: string[]
}

export function ClientNavWrapper({ initialUser, categories }: ClientNavWrapperProps) {
  const [user, setUser] = useState<User | null>(initialUser || null)
  const supabase = createClient()

  useEffect(() => {
    // Get current user on mount
    const getCurrentUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('ClientNavWrapper - Current user:', currentUser)
      setUser(currentUser)
    }

    getCurrentUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('ClientNavWrapper - Auth state change:', event, session?.user)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return <ModernNav user={user} categories={categories} />
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ModernNav } from './modern-nav'
import { User } from '@supabase/supabase-js'

interface ClientNavWrapperProps {
  initialUser?: User | null
  categories?: string[]
}

export function ClientNavWrapper({ initialUser, categories }: ClientNavWrapperProps) {
  const [user, setUser] = useState<User | null>(initialUser || null)
  const supabase = createClient()

  useEffect(() => {
    // Get current user on mount
    const getCurrentUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
      }
    }

    getCurrentUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('ClientNavWrapper - Auth state change:', event, session?.user)
      setUser(session?.user ?? null)
      
      // Force page reload on sign out to clear all cached state
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state and redirecting')
        
        // Clear any remaining local storage items
        try {
          localStorage.removeItem('supabase.auth.token')
          sessionStorage.clear()
        } catch (error) {
          console.warn('Error clearing storage:', error)
        }
        
        // Small delay to ensure the state is updated
        setTimeout(() => {
          const currentPath = window.location.pathname
          console.log('Current path:', currentPath)
          
          if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/landing') {
            console.log('Redirecting to login page')
            window.location.replace('/login')
          }
        }, 150)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return <ModernNav user={user ? {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata
  } : undefined} categories={categories} />
}

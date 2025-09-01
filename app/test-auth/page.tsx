'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function TestAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      console.log('Test page - Current user:', user)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Test page - Auth state change:', event, session?.user)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      {user ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800">✅ User Logged In</h2>
            <p className="text-green-700">Email: {user.email}</p>
            <p className="text-green-700">ID: {user.id}</p>
            <p className="text-green-700">Created: {new Date(user.created_at).toLocaleString()}</p>
            <p className="text-green-700">Last Sign In: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</p>
            
            {user.user_metadata && (
              <div className="mt-2">
                <p className="text-green-700">Metadata:</p>
                <pre className="text-xs text-green-600 mt-1 bg-green-50 p-2 rounded overflow-auto">
                  {JSON.stringify(user.user_metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-red-100 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800">❌ User Not Logged In</h2>
            <p className="text-red-700">Please log in to continue</p>
          </div>
          
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      )}
    </div>
  )
}

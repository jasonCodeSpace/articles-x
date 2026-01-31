'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, PlusCircle, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function ManualArticleSubmit() {
  const [url, setUrl] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is authorized
  useEffect(() => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Initial check
    const checkAuthorization = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user?.email === 'jcwang0919@gmail.com') {
        setIsAuthorized(true)
      }
      setIsLoading(false)
    }

    checkAuthorization()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email === 'jcwang0919@gmail.com') {
        setIsAuthorized(true)
      } else {
        setIsAuthorized(false)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setMessage({ type: 'error', text: 'Please sign in first' })
        setLoading(false)
        return
      }

      const response = await fetch('/api/manual-insert-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ url, password })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Article inserted successfully! You can now access it.' })
        setUrl('')
        setPassword('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit article' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="mb-8 p-6 rounded-2xl bg-white/[0.03] border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <PlusCircle className="text-white/60" size={20} />
        <h3 className="text-lg font-bold">Manual Article Insert</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="url"
            placeholder="https://x.com/username/article/1234567890"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <div>
          <Input
            type="password"
            placeholder="Insertion password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-white/10 hover:bg-white/20 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Submit Article'
          )}
        </Button>

        {message && (
          <div className={`flex items-start gap-2 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle size={16} className="mt-0.5 flex-shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}
      </form>
    </div>
  )
}

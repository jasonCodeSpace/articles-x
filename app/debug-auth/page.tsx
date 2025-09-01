'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function DebugAuth() {
  const [email, setEmail] = useState('jcwang0919@gmail.com')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const testConnection = async () => {
    setLoading(true)
    try {
      // Test database connection
      const { data, error } = await supabase.from('articles').select('count').limit(1)
      if (error) {
        setResult(`❌ Database connection failed: ${error.message}`)
      } else {
        setResult('✅ Database connection successful')
      }
    } catch (error) {
      setResult(`❌ Connection error: ${error}`)
    }
    setLoading(false)
  }

  const testLogin = async () => {
    if (!password) {
      setResult('❌ Please enter a password')
      return
    }

    setLoading(true)
    try {
      console.log('Attempting login with:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) {
        setResult(`❌ Login failed: ${error.message}`)
        console.error('Auth error:', error)
      } else {
        setResult(`✅ Login successful! User: ${data.user?.email}`)
        console.log('Auth success:', data)
      }
    } catch (error) {
      setResult(`❌ Login error: ${error}`)
      console.error('Login error:', error)
    }
    setLoading(false)
  }

  const checkUser = async () => {
    setLoading(true)
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        setResult(`❌ Get user failed: ${error.message}`)
      } else if (user) {
        setResult(`✅ User logged in: ${user.email}`)
      } else {
        setResult('ℹ️ No user logged in')
      }
    } catch (error) {
      setResult(`❌ Check user error: ${error}`)
    }
    setLoading(false)
  }

  const logout = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setResult(`❌ Logout failed: ${error.message}`)
      } else {
        setResult('✅ Logged out successfully')
      }
    } catch (error) {
      setResult(`❌ Logout error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>
      
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-800 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-800 text-white"
            placeholder="Enter password to test login"
          />
        </div>
        
        <div className="space-y-2">
          <Button onClick={testConnection} disabled={loading} className="w-full">
            Test Database Connection
          </Button>
          <Button onClick={testLogin} disabled={loading} className="w-full">
            Test Login
          </Button>
          <Button onClick={checkUser} disabled={loading} className="w-full">
            Check Current User
          </Button>
          <Button onClick={logout} disabled={loading} className="w-full">
            Logout
          </Button>
        </div>
        
        <div className="mt-8 p-4 bg-gray-800 rounded">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
        
        <div className="mt-4 p-4 bg-gray-900 rounded text-xs">
          <h3 className="font-bold mb-2">Environment Check:</h3>
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
          <p>Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
        </div>
      </div>
    </div>
  )
}

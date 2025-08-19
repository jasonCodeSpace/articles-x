import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // Handle OAuth errors (expired links, access denied, etc.)
  if (error) {
    const errorUrl = new URL('/auth/auth-code-error', origin)
    errorUrl.searchParams.set('error', error)
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(errorUrl.toString())
  }

  // Handle authentication code
  if (code) {
    try {
      const supabase = await createClient()
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        const errorUrl = new URL('/auth/auth-code-error', origin)
        errorUrl.searchParams.set('error', 'exchange_failed')
        errorUrl.searchParams.set('error_description', exchangeError.message)
        return NextResponse.redirect(errorUrl.toString())
      }

      if (data.user) {
        console.log('User authenticated successfully:', data.user.email)
        
        // Redirect to the requested page or home
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        let redirectUrl: string
        if (isLocalEnv) {
          redirectUrl = `${origin}${next}`
        } else if (forwardedHost) {
          redirectUrl = `https://${forwardedHost}${next}`
        } else {
          redirectUrl = `${origin}${next}`
        }
        
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      const errorUrl = new URL('/auth/auth-code-error', origin)
      errorUrl.searchParams.set('error', 'unexpected_error')
      errorUrl.searchParams.set('error_description', 'An unexpected error occurred during authentication')
      return NextResponse.redirect(errorUrl.toString())
    }
  }

  // No code and no error - invalid callback
  const errorUrl = new URL('/auth/auth-code-error', origin)
  errorUrl.searchParams.set('error', 'invalid_callback')
  errorUrl.searchParams.set('error_description', 'No authentication code provided')
  return NextResponse.redirect(errorUrl.toString())
}
import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with service role key for server-side operations
 * This bypasses Row Level Security (RLS) and should only be used for trusted operations
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Supabase environment variables are not set. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Create a service-role Supabase client for server-side writes
 * This bypasses RLS (Row Level Security) for background operations
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Supabase service role environment variables are not set. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  return createSupabaseClient(supabaseUrl, serviceKey)
}

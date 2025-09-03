import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Enable dynamic generation to check user auth status
export const dynamic = 'force-dynamic'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // If user is logged in, redirect to trending page
  // If user is not logged in, redirect to landing page
  if (user) {
    redirect('/trending')
  } else {
    redirect('/landing')
  }
}
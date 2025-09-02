import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export interface TwitterList {
  id: string
  list_id: string
  name: string
  description?: string
  owner_username?: string
  member_count?: number
  status: 'active' | 'inactive'
  last_scanned_at?: string
  articles_found?: number
  created_at: string
  updated_at: string
}

export interface TwitterListStats {
  total_lists: number
  active_lists: number
  inactive_lists: number
  last_scan_time?: string
  next_scan_time?: string
}


export async function getTwitterLists(): Promise<TwitterList[]> {
  // Use direct Supabase client with service role key for better permissions
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  const supabase = createSupabaseClient(supabaseUrl, serviceKey)
  
  const { data, error } = await supabase
    .from('twitter_lists')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching Twitter lists:', error)
    throw new Error('Failed to fetch Twitter lists')
  }
  
  console.log(`Found ${data?.length || 0} Twitter lists`)
  return data || []
}

export async function getActiveTwitterListIds(): Promise<string[]> {
  // Always use direct Supabase client with service role key for scheduler context
  // Server client uses anon key which doesn't have sufficient permissions
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('Environment check:', {
    supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
    serviceKey: serviceKey ? 'Set' : 'Not set'
  })
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  const supabase = createSupabaseClient(supabaseUrl, serviceKey)
  console.log('Using direct Supabase client with service role key for getActiveTwitterListIds')
  
  const { data, error } = await supabase
    .from('twitter_lists')
    .select('list_id')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching active Twitter list IDs:', error)
    throw new Error('Failed to fetch active Twitter list IDs')
  }
  
  const listIds = data?.map((item: { list_id: string }) => item.list_id) || []
  console.log(`Found ${listIds.length} active Twitter lists using direct client with service role key`)
  
  return listIds
}

export async function updateTwitterList(listId: string, updates: Partial<Omit<TwitterList, 'id' | 'created_at' | 'updated_at'>>): Promise<TwitterList> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('twitter_lists')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('list_id', listId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating Twitter list:', error)
    throw new Error('Failed to update Twitter list')
  }
  
  return data
}


export async function markListAsScanned(listId: string, articlesFound?: number): Promise<void> {
  const supabase = await createClient()
  
  const updateData: { last_scanned_at: string; updated_at: string; articles_found?: number } = {
    last_scanned_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  if (articlesFound !== undefined) {
    updateData.articles_found = articlesFound
  }
  
  const { error } = await supabase
    .from('twitter_lists')
    .update(updateData)
    .eq('list_id', listId)
  
  if (error) {
    console.error('Error marking list as scanned:', error)
    throw new Error('Failed to mark list as scanned')
  }
}

export async function getTwitterListStats(): Promise<TwitterListStats> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('twitter_lists')
    .select('status, last_scanned_at')
  
  if (error) {
    console.error('Error fetching Twitter list stats:', error)
    throw new Error('Failed to fetch Twitter list stats')
  }
  
  const total_lists = data?.length || 0
  const active_lists = data?.filter(list => list.status === 'active').length || 0
  const inactive_lists = total_lists - active_lists
  
  // Find the most recent scan time
  const lastScanTimes = data
    ?.filter(list => list.last_scanned_at)
    .map(list => new Date(list.last_scanned_at!))
    .sort((a, b) => b.getTime() - a.getTime())
  
  const last_scan_time = lastScanTimes?.[0]?.toISOString()
  
  // Calculate next scan time (interval from last scan, default 8 minutes)
  const intervalMinutes = parseInt(process.env.SCHEDULER_INTERVAL_MINUTES || '8')
  const next_scan_time = last_scan_time 
    ? new Date(new Date(last_scan_time).getTime() + intervalMinutes * 60 * 1000).toISOString()
    : undefined
  
  return {
    total_lists,
    active_lists,
    inactive_lists,
    last_scan_time,
    next_scan_time
  }
}


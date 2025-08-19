import { createClient } from '@/lib/supabase/server'

export interface TwitterList {
  id: string
  list_id: string
  name: string
  description?: string
  owner_username?: string
  member_count?: number
  is_active: boolean
  last_scanned_at?: string
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

// Default 26 Twitter lists configuration
const DEFAULT_TWITTER_LISTS = [
  { list_id: '78468360', name: 'Tech News', description: 'Technology and startup news' },
  { list_id: 'list2', name: 'AI & ML', description: 'Artificial Intelligence and Machine Learning' },
  { list_id: 'list3', name: 'Web Development', description: 'Web development and programming' },
  { list_id: 'list4', name: 'Crypto & Blockchain', description: 'Cryptocurrency and blockchain news' },
  { list_id: 'list5', name: 'Business News', description: 'Business and finance updates' },
  { list_id: 'list6', name: 'Science', description: 'Scientific discoveries and research' },
  { list_id: 'list7', name: 'Design', description: 'UI/UX and graphic design' },
  { list_id: 'list8', name: 'Marketing', description: 'Digital marketing and growth' },
  { list_id: 'list9', name: 'Productivity', description: 'Productivity tips and tools' },
  { list_id: 'list10', name: 'Health & Wellness', description: 'Health and wellness content' },
  { list_id: 'list11', name: 'Climate & Environment', description: 'Environmental news and climate change' },
  { list_id: 'list12', name: 'Politics', description: 'Political news and analysis' },
  { list_id: 'list13', name: 'Sports', description: 'Sports news and updates' },
  { list_id: 'list14', name: 'Entertainment', description: 'Movies, TV, and entertainment' },
  { list_id: 'list15', name: 'Gaming', description: 'Video games and gaming industry' },
  { list_id: 'list16', name: 'Education', description: 'Educational content and resources' },
  { list_id: 'list17', name: 'Travel', description: 'Travel tips and destinations' },
  { list_id: 'list18', name: 'Food & Cooking', description: 'Recipes and culinary content' },
  { list_id: 'list19', name: 'Photography', description: 'Photography tips and inspiration' },
  { list_id: 'list20', name: 'Music', description: 'Music news and discoveries' },
  { list_id: 'list21', name: 'Books & Literature', description: 'Book recommendations and literary content' },
  { list_id: 'list22', name: 'Fashion', description: 'Fashion trends and style' },
  { list_id: 'list23', name: 'Real Estate', description: 'Real estate market and investment' },
  { list_id: 'list24', name: 'Automotive', description: 'Car news and automotive industry' },
  { list_id: 'list25', name: 'Space & Astronomy', description: 'Space exploration and astronomy' },
  { list_id: 'list26', name: 'Lifestyle', description: 'General lifestyle and personal development' }
]

export async function getTwitterLists(): Promise<TwitterList[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('twitter_lists')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching Twitter lists:', error)
    throw new Error('Failed to fetch Twitter lists')
  }
  
  return data || []
}

export async function getActiveTwitterListIds(): Promise<string[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('twitter_lists')
    .select('list_id')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching active Twitter list IDs:', error)
    throw new Error('Failed to fetch active Twitter list IDs')
  }
  
  return data?.map((item: { list_id: string }) => item.list_id) || []
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

export async function toggleTwitterListStatus(listId: string): Promise<TwitterList> {
  const supabase = await createClient()
  
  // First get the current status
  const { data: currentList, error: fetchError } = await supabase
    .from('twitter_lists')
    .select('is_active')
    .eq('list_id', listId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching Twitter list:', fetchError)
    throw new Error('Failed to fetch Twitter list')
  }
  
  // Toggle the status
  return updateTwitterList(listId, { is_active: !currentList.is_active })
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
    .select('is_active, last_scanned_at')
  
  if (error) {
    console.error('Error fetching Twitter list stats:', error)
    throw new Error('Failed to fetch Twitter list stats')
  }
  
  const total_lists = data?.length || 0
  const active_lists = data?.filter(list => list.is_active).length || 0
  const inactive_lists = total_lists - active_lists
  
  // Find the most recent scan time
  const lastScanTimes = data
    ?.filter(list => list.last_scanned_at)
    .map(list => new Date(list.last_scanned_at!))
    .sort((a, b) => b.getTime() - a.getTime())
  
  const last_scan_time = lastScanTimes?.[0]?.toISOString()
  
  // Calculate next scan time (15 minutes from last scan)
  const next_scan_time = last_scan_time 
    ? new Date(new Date(last_scan_time).getTime() + 15 * 60 * 1000).toISOString()
    : undefined
  
  return {
    total_lists,
    active_lists,
    inactive_lists,
    last_scan_time,
    next_scan_time
  }
}

export async function initializeDefaultTwitterLists(): Promise<void> {
  const supabase = await createClient()
  
  // Check if lists already exist
  const { data: existingLists } = await supabase
    .from('twitter_lists')
    .select('list_id')
  
  const existingListIds = new Set(existingLists?.map(list => list.list_id) || [])
  
  // Insert only new lists
  const newLists = DEFAULT_TWITTER_LISTS.filter(list => !existingListIds.has(list.list_id))
  
  if (newLists.length > 0) {
    const { error } = await supabase
      .from('twitter_lists')
      .insert(
        newLists.map(list => ({
          list_id: list.list_id,
          name: list.name,
          description: list.description,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      )
    
    if (error) {
      console.error('Error initializing default Twitter lists:', error)
      throw new Error('Failed to initialize default Twitter lists')
    }
    
    console.log(`📋 Initialized ${newLists.length} new Twitter lists`)
  } else {
    console.log('📋 All default Twitter lists already exist')
  }
}
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// Using custom styled components instead of missing Badge and Switch
import { RefreshCw, List, Users, Clock } from 'lucide-react'

interface TwitterList {
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
  globalStats?: {
    total_lists: number
    active_lists: number
    inactive_lists: number
    last_scan_time?: string
    next_scan_time?: string
  }
}

interface TwitterListsResponse {
  success: boolean
  lists: TwitterList[]
  error?: string
}

export function TwitterListsManager() {
  const [lists, setLists] = useState<TwitterList[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<TwitterList['globalStats'] | null>(null)

  const fetchLists = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/twitter-lists?includeStats=true')
      const data: TwitterListsResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch Twitter lists')
      }
      
      setLists(data.lists)
      if (data.lists.length > 0 && data.lists[0].globalStats) {
        setStats(data.lists[0].globalStats)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleListStatus = async (listId: string, currentStatus: boolean) => {
    try {
      setUpdating(listId)
      setError(null)
      
      const response = await fetch('/api/twitter-lists', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listId,
          isActive: !currentStatus
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update list status')
      }
      
      // Update the list in state
      setLists(prev => prev.map(list => 
        list.list_id === listId 
          ? { ...list, is_active: !currentStatus }
          : list
      ))
      
      // Update stats
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          active_lists: !currentStatus ? prev.active_lists + 1 : prev.active_lists - 1,
          inactive_lists: !currentStatus ? prev.inactive_lists - 1 : prev.inactive_lists + 1
        } : null)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUpdating(null)
    }
  }

  useEffect(() => {
    fetchLists()
  }, [])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Twitter Lists Manager
          </CardTitle>
          <CardDescription>
            Loading Twitter lists...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lists Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.total_lists}</div>
                <div className="text-sm text-gray-400">Total Lists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.active_lists}</div>
                <div className="text-sm text-gray-400">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{stats.inactive_lists}</div>
                <div className="text-sm text-gray-400">Inactive</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Last Scan</div>
                <div className="text-xs text-gray-500">
                  {stats.last_scan_time ? formatDate(stats.last_scan_time) : 'Never'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lists Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Twitter Lists Manager
              </CardTitle>
              <CardDescription>
                Manage the 26 Twitter lists for automated scanning
              </CardDescription>
            </div>
            <Button
              onClick={fetchLists}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            {lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-white">{list.name}</h3>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        list.is_active 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {list.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {list.description && (
                    <p className="text-sm text-gray-400 mb-2">{list.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>ID: {list.list_id}</span>
                    {list.member_count && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {list.member_count} members
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last scanned: {formatDate(list.last_scanned_at)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleListStatus(list.list_id, list.is_active)}
                    disabled={updating === list.list_id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                      list.is_active ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        list.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  {updating === list.list_id && (
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {lists.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-400">
              <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No Twitter lists found</p>
              <p className="text-sm mt-2">Lists should be automatically initialized</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
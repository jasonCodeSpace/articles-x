'use client'

import { useState, useEffect } from 'react'
import { Clock, Play, Square, RefreshCw, XCircle } from 'lucide-react'

interface SchedulerStats {
  isRunning: boolean
  lastRunTime?: string
  nextRunTime?: string
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  lastError?: string
}

export function SchedulerStatus() {
  const [stats, setStats] = useState<SchedulerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/scheduler')
      if (response.ok) {
        const data = await response.json()
        setStats(data.scheduler)
        setError(null)
      } else {
        setError('Failed to fetch scheduler status')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const controlScheduler = async (action: 'start' | 'stop') => {
    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      if (response.ok) {
        await fetchStats()
      } else {
        setError(`Failed to ${action} scheduler`)
      }
    } catch {
      setError('Network error')
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading scheduler status...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-400">
          <XCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-400">
          <XCircle className="w-4 h-4" />
          <span>Scheduler not initialized</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Twitter Scanner</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            stats.isRunning 
              ? 'bg-green-900/30 text-green-400 border border-green-800' 
              : 'bg-red-900/30 text-red-400 border border-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              stats.isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            {stats.isRunning ? 'Running' : 'Stopped'}
          </div>
          
          <button
            onClick={() => controlScheduler(stats.isRunning ? 'stop' : 'start')}
            className={`p-2 rounded-lg transition-colors ${
              stats.isRunning
                ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400'
                : 'bg-green-900/30 hover:bg-green-900/50 text-green-400'
            }`}
          >
            {stats.isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={fetchStats}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.totalRuns}</div>
          <div className="text-xs text-gray-400">Total Runs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats.successfulRuns}</div>
          <div className="text-xs text-gray-400">Successful</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{stats.failedRuns}</div>
          <div className="text-xs text-gray-400">Failed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {stats.successfulRuns > 0 ? Math.round((stats.successfulRuns / stats.totalRuns) * 100) : 0}%
          </div>
          <div className="text-xs text-gray-400">Success Rate</div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        {stats.lastRunTime && (
          <div className="flex justify-between text-gray-300">
            <span>Last Run:</span>
            <span>{new Date(stats.lastRunTime).toLocaleString()}</span>
          </div>
        )}
        {stats.nextRunTime && stats.isRunning && (
          <div className="flex justify-between text-gray-300">
            <span>Next Run:</span>
            <span>{new Date(stats.nextRunTime).toLocaleString()}</span>
          </div>
        )}
        {stats.lastError && (
          <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-800">
            <strong>Last Error:</strong> {stats.lastError}
          </div>
        )}
      </div>
    </div>
  )
}
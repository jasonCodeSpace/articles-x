import { createTwitterClient, TwitterTweet, ingestTweetsFromLists } from './services'
import { getActiveTwitterListIds, markListAsScanned } from './twitter-lists'

interface SchedulerConfig {
  enabled: boolean
  intervalMinutes: number
  autoStart: boolean
  cronSecret: string
  apiBaseUrl: string
}

interface SchedulerStats {
  isRunning: boolean
  lastRunTime?: Date
  nextRunTime?: Date
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  lastError?: string
}

export class TwitterListScheduler {
  private config: SchedulerConfig
  private intervalId?: NodeJS.Timeout
  private stats: SchedulerStats
  private isProcessing = false

  constructor(config: SchedulerConfig) {
    this.config = config
    this.stats = {
      isRunning: false,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0
    }

    if (this.config.autoStart && this.config.enabled) {
      this.start()
    }
  }

  start(): void {
    if (this.stats.isRunning) {
      console.log('📅 Scheduler is already running')
      return
    }

    if (!this.config.enabled) {
      console.log('📅 Scheduler is disabled')
      return
    }

    console.log(`📅 Starting Twitter list scheduler (every ${this.config.intervalMinutes} minutes)`)
    
    this.stats.isRunning = true
    this.updateNextRunTime()
    
    // Run immediately on start
    this.runIngestProcess()
    
    // Set up recurring interval
    this.intervalId = setInterval(() => {
      this.runIngestProcess()
    }, this.config.intervalMinutes * 60 * 1000)
  }

  stop(): void {
    if (!this.stats.isRunning) {
      console.log('📅 Scheduler is not running')
      return
    }

    console.log('📅 Stopping Twitter list scheduler')
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    
    this.stats.isRunning = false
    this.stats.nextRunTime = undefined
  }

  getStats(): SchedulerStats {
    return { ...this.stats }
  }

  private async runIngestProcess(): Promise<void> {
    if (this.isProcessing) {
      console.log('📅 Skipping run - previous ingest still processing')
      return
    }

    this.isProcessing = true
    this.stats.totalRuns++
    this.stats.lastRunTime = new Date()
    this.updateNextRunTime()

    console.log(`📅 Starting scheduled ingest run #${this.stats.totalRuns}`)

    try {
      console.log('🔄 Starting scheduled Twitter ingest...')
      
      // Get active Twitter list IDs from database
      const twitterListIds = await getActiveTwitterListIds()
      
      if (twitterListIds.length === 0) {
        console.warn('⚠️ No active Twitter lists found in database')
        this.stats.failedRuns++
        this.stats.lastError = 'No active Twitter lists found'
        return
      }
      
      console.log(`📋 Processing ${twitterListIds.length} active Twitter lists...`)
      
      // Create Twitter client with rate limiting
       const twitterClient = createTwitterClient()
       const listTweets = new Map<string, TwitterTweet[]>()
       
       console.log(`🚀 Processing ${twitterListIds.length} lists concurrently with rate limiting (9 req/sec)...`)
       const startTime = Date.now()
       
       // Process all lists concurrently - rate limiting is handled by TwitterClient
       const listPromises = twitterListIds.map(async (listId) => {
         try {
           console.log(`📋 Starting list ${listId}...`)
           
           // Fetch tweets from this list (rate-limited internally)
           const tweets = await twitterClient.fetchAllListPages(listId)
           listTweets.set(listId, tweets)
           
           console.log(`✅ List ${listId}: Found ${tweets.length} tweets`)
           
           // Mark list as scanned
           await markListAsScanned(listId, tweets.length)
           
           return { listId, success: true, tweetCount: tweets.length }
           
         } catch (listError) {
           console.error(`❌ Error processing list ${listId}:`, listError)
           // Add empty array for failed lists
           listTweets.set(listId, [])
           return { listId, success: false, error: listError }
         }
       })
       
       // Wait for all lists to complete
       const results = await Promise.all(listPromises)
       const endTime = Date.now()
       const totalTime = (endTime - startTime) / 1000
       
       const successful = results.filter(r => r.success).length
        const failed = results.filter(r => !r.success).length
        const totalTweets = results.reduce((sum, r) => sum + (r.success ? (r.tweetCount || 0) : 0), 0)
       
       console.log(`⏱️ Completed ${twitterListIds.length} lists in ${totalTime.toFixed(2)}s (${successful} successful, ${failed} failed, ${totalTweets} total tweets)`)
       
       // Ingest all tweets using the existing function
       const result = await ingestTweetsFromLists(listTweets, false)
       
       console.log(`✅ Ingest completed: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`)
      
      this.stats.successfulRuns++
      this.stats.lastError = undefined

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('📅 Scheduled ingest failed:', errorMessage)
      
      this.stats.failedRuns++
      this.stats.lastError = errorMessage
    } finally {
      this.isProcessing = false
    }
  }

  private updateNextRunTime(): void {
    if (this.stats.isRunning) {
      this.stats.nextRunTime = new Date(Date.now() + this.config.intervalMinutes * 60 * 1000)
    }
  }
}

// Global scheduler instance
let globalScheduler: TwitterListScheduler | null = null

export function createScheduler(): TwitterListScheduler {
  if (globalScheduler) {
    return globalScheduler
  }

  const config: SchedulerConfig = {
    enabled: process.env.SCHEDULER_ENABLED === 'true',
    intervalMinutes: parseInt(process.env.SCHEDULER_INTERVAL_MINUTES || '10'),
    autoStart: process.env.SCHEDULER_AUTO_START === 'true',
    cronSecret: process.env.CRON_SECRET || '',
    apiBaseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
  }

  if (!config.cronSecret) {
    console.warn('📅 CRON_SECRET not configured - scheduler will not work')
  }

  globalScheduler = new TwitterListScheduler(config)
  return globalScheduler
}

export function getScheduler(): TwitterListScheduler | null {
  return globalScheduler
}

export function startScheduler(): void {
  const scheduler = createScheduler()
  scheduler.start()
}

export function stopScheduler(): void {
  if (globalScheduler) {
    globalScheduler.stop()
  }
}

export function getSchedulerStats(): SchedulerStats | null {
  return globalScheduler?.getStats() || null
}
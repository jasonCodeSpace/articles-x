/**
 * Rate limiter for Twitter API requests
 * Ensures requests are spaced out to respect API limits
 */

const DEFAULT_REQUEST_INTERVAL_MS = 100 // 10 requests per second

export class RateLimiter {
  private requestQueue: Array<() => Promise<unknown>> = []
  private isProcessingQueue = false
  private lastRequestTime = 0
  private readonly requestIntervalMs: number

  constructor(requestIntervalMs = DEFAULT_REQUEST_INTERVAL_MS) {
    this.requestIntervalMs = requestIntervalMs
  }

  /**
   * Execute a request function with rate limiting
   */
  async execute<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.processQueue()
    })
  }

  /**
   * Process the request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime

      if (timeSinceLastRequest < this.requestIntervalMs) {
        const waitTime = this.requestIntervalMs - timeSinceLastRequest
        await this.sleep(waitTime)
      }

      const requestFn = this.requestQueue.shift()
      if (requestFn) {
        this.lastRequestTime = Date.now()
        await requestFn()
      }
    }

    this.isProcessingQueue = false
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get a standalone sleep function (for external use)
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

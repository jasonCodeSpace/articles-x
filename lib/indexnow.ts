/**
 * IndexNow API Service
 *
 * IndexNow allows you to instantly notify search engines (Bing, Google, Yandex)
 * when your website's content is added, updated, or deleted.
 *
 * Documentation: https://www.indexnow.org/
 *
 * No registration required. Completely free.
 */

const INDEXNOW_ENDPOINTS = [
  'https://www.bing.com/IndexNow',  // Bing (also forwards to Google)
  // 'https://indexnow.yandex.com/indexnow',  // Yandex (optional)
]

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'xarticle_news_key'
const SITE_HOST = 'www.xarticle.news'

export interface IndexNowResponse {
  success: boolean
  engine: string
  status?: number
  error?: string
}

/**
 * Notify search engines about a single URL
 */
export async function notifyIndexNow(url: string): Promise<IndexNowResponse[]> {
  const results: IndexNowResponse[] = []

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const engine = endpoint.includes('bing') ? 'Bing' : 'Unknown'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: SITE_HOST,
          key: INDEXNOW_KEY,
          urlList: [url],
        }),
      })

      if (response.ok) {
        results.push({ success: true, engine })
        console.log(`[IndexNow] Successfully notified ${engine} about: ${url}`)
      } else {
        results.push({
          success: false,
          engine,
          status: response.status,
          error: response.statusText,
        })
        console.error(`[IndexNow] Failed to notify ${engine}:`, response.status, response.statusText)
      }
    } catch (error) {
      results.push({
        success: false,
        engine: endpoint.includes('bing') ? 'Bing' : 'Unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      console.error(`[IndexNow] Error notifying ${endpoint}:`, error)
    }
  }

  return results
}

/**
 * Notify search engines about multiple URLs (batch)
 * Use this when publishing multiple articles at once
 */
export async function notifyIndexNowBatch(urls: string[]): Promise<IndexNowResponse[]> {
  const results: IndexNowResponse[] = []

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const engine = endpoint.includes('bing') ? 'Bing' : 'Unknown'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: SITE_HOST,
          key: INDEXNOW_KEY,
          urlList: urls,
        }),
      })

      if (response.ok) {
        results.push({ success: true, engine })
        console.log(`[IndexNow] Successfully notified ${engine} about ${urls.length} URLs`)
      } else {
        results.push({
          success: false,
          engine,
          status: response.status,
          error: response.statusText,
        })
      }
    } catch (error) {
      results.push({
        success: false,
        engine: endpoint.includes('bing') ? 'Bing' : 'Unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

/**
 * Generate the IndexNow key file location
 * The key file must be hosted at: https://your-domain.com/{key}.txt
 * containing only the key value.
 */
export function getIndexNowKeyFileLocation(): string {
  return `/${INDEXNOW_KEY}.txt`
}

/**
 * Verify if the key is properly configured
 */
export function isIndexNowConfigured(): boolean {
  return !!INDEXNOW_KEY && INDEXNOW_KEY !== 'xarticle_news_key'
}

/**
 * Helper function to construct article URL
 */
export function getArticleUrl(slug: string): string {
  return `https://${SITE_HOST}/article/${slug}`
}

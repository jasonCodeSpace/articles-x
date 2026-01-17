/**
 * Parse Twitter date format to ISO string
 *
 * Twitter dates are in format: "Wed Oct 05 21:25:35 +0000 2022"
 */
export function parseTwitterDate(twitterDate: string): string {
  try {
    const date = new Date(twitterDate)
    return date.toISOString()
  } catch {
    console.warn(`Failed to parse Twitter date ${twitterDate}, using current time`)
    return new Date().toISOString()
  }
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

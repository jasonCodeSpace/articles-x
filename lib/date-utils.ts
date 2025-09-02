/**
 * Lightweight date utility functions to replace date-fns
 * Reduces bundle size by avoiding the large date-fns library
 */

/**
 * Format distance to now in a human-readable format
 * Replaces date-fns formatDistanceToNow function
 */
export function formatDistanceToNow(date: Date, options: { addSuffix?: boolean } = {}): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)

  let result: string

  if (diffInSeconds < 60) {
    result = 'less than a minute'
  } else if (diffInMinutes < 60) {
    result = diffInMinutes === 1 ? '1 minute' : `${diffInMinutes} minutes`
  } else if (diffInHours < 24) {
    result = diffInHours === 1 ? '1 hour' : `${diffInHours} hours`
  } else if (diffInDays < 30) {
    result = diffInDays === 1 ? '1 day' : `${diffInDays} days`
  } else if (diffInMonths < 12) {
    result = diffInMonths === 1 ? '1 month' : `${diffInMonths} months`
  } else {
    result = diffInYears === 1 ? '1 year' : `${diffInYears} years`
  }

  return options.addSuffix ? `${result} ago` : result
}
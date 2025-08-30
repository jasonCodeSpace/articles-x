// Test URL parsing
function extractArticleIdFromSlug(slug) {
  const parts = slug.split('--')
  return parts[parts.length - 1]
}

const testSlug = 'advance-uks-bet-britain-must-name-its-adversary-is--f77b5d'
const shortId = extractArticleIdFromSlug(testSlug)
console.log('Short ID from URL:', shortId)
console.log('Short ID length:', shortId.length)
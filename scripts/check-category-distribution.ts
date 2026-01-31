/**
 * Check article distribution by category
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(String(supabaseUrl), String(serviceKey))

async function main() {
  // Get all indexed articles with their categories
  const { data: articles } = await supabase
    .from('articles')
    .select('category, main_category, sub_category')
    .eq('indexed', true)

  // Count by category
  const categoryCounts: Record<string, number> = {}
  const mainCounts: Record<string, number> = {}
  const subCounts: Record<string, number> = {}

  for (const article of articles || []) {
    if (article.category) {
      categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1
    }
    if (article.main_category) {
      mainCounts[article.main_category] = (mainCounts[article.main_category] || 0) + 1
    }
    if (article.sub_category) {
      subCounts[article.sub_category] = (subCounts[article.sub_category] || 0) + 1
    }
  }

  console.log('=== By Combined Category ===')
  Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`${cat}: ${count}`)
  })

  console.log('\n=== By Main Category ===')
  Object.entries(mainCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`${cat}: ${count}`)
  })

  console.log('\n=== By Sub Category ===')
  Object.entries(subCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`${cat}: ${count}`)
  })

  console.log('\n=== Empty Categories ===')
  const categories = [
    'tech:ai', 'tech:crypto', 'tech:data', 'tech:security', 'tech:hardware',
    'business:startups', 'business:markets', 'business:marketing',
    'product:product', 'product:design', 'product:gaming',
    'science:science', 'science:health', 'science:education', 'science:environment',
    'culture:media', 'culture:culture', 'culture:philosophy', 'culture:history', 'culture:policy', 'culture:personal-story'
  ]
  categories.forEach(cat => {
    if (!categoryCounts[cat]) {
      console.log(`${cat}: EMPTY`)
    }
  })
}

main()

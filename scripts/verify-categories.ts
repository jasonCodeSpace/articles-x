import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function main() {
  const { data, count } = await supabase
    .from('article_categories')
    .select('*', { count: 'exact' })

  console.log('article_categories records:', count)

  // Show categories with counts
  const { data: cats } = await supabase
    .from('article_categories')
    .select('category')

  const counts: Record<string, number> = {}
  cats?.forEach(c => {
    counts[c.category] = (counts[c.category] || 0) + 1
  })

  console.log('\nCategories in junction table:')
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([cat, cnt]) => {
    console.log(`  ${cat}: ${cnt}`)
  })
}
main()

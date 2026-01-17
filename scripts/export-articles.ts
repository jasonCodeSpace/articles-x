#!/usr/bin/env npx tsx
/**
 * 导出所有文章到 JSON 文件（按月份分组）
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const client = createClient(SUPABASE_URL, SUPABASE_KEY)

async function exportArticles() {
  console.log('📦 Exporting all articles...\n')

  // Fetch all articles with pagination
  const allArticles: any[] = []
  const pageSize = 1000
  let page = 0

  while (true) {
    const { data: articles, error } = await client
      .from('articles')
      .select('*')
      .order('article_published_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    if (!articles || articles.length === 0) break

    allArticles.push(...articles)
    console.log(`📥 Fetched page ${page + 1}: ${articles.length} articles`)
    page++
  }

  const articles = allArticles
  console.log(`\n📊 Total articles: ${articles.length}`)

  // Group by month
  const byMonth: Record<string, any[]> = {}

  for (const article of articles) {
    const date = article.article_published_at || article.updated_at
    if (date) {
      const month = date.substring(0, 7) // YYYY-MM
      if (!byMonth[month]) {
        byMonth[month] = []
      }
      byMonth[month].push(article)
    }
  }

  // Ensure directory exists
  if (!fs.existsSync('data/archive')) {
    fs.mkdirSync('data/archive', { recursive: true })
  }

  // Save each month to a file
  for (const [month, monthArticles] of Object.entries(byMonth)) {
    const filename = `data/archive/articles-${month}.json`
    fs.writeFileSync(filename, JSON.stringify(monthArticles, null, 2))
    console.log(`✅ Saved ${monthArticles.length} articles to ${filename}`)
  }

  console.log('\n🎉 Export complete!')
}

exportArticles()

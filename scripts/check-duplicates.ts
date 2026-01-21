#!/usr/bin/env tsx
/**
 * Check for duplicate articles
 * Looks for duplicates by title, content similarity, and article_url
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simple similarity check using Jaccard similarity on word sets
function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0

  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3))

  if (words1.size === 0 || words2.size === 0) return 0

  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])

  return intersection.size / union.size
}

// Normalize title for comparison
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function checkDuplicates() {
  console.log('=== 检查重复文章 ===\n')

  // Get all articles, ordered by most recent
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, full_article_content, article_url, tweet_id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error || !articles) {
    console.error('Error fetching articles:', error)
    return
  }

  console.log(`检查 ${articles.length} 篇最新文章...\n`)

  const duplicates: Array<{
    original: typeof articles[0]
    duplicate: typeof articles[0]
    reason: string
    similarity: number
  }> = []

  // Check for exact title matches
  const titleMap = new Map<string, typeof articles[0][]>()
  for (const article of articles) {
    const normalTitle = normalizeTitle(article.title)
    if (!titleMap.has(normalTitle)) {
      titleMap.set(normalTitle, [])
    }
    titleMap.get(normalTitle)!.push(article)
  }

  for (const [title, arts] of titleMap) {
    if (arts.length > 1) {
      console.log(`[标题重复] ${title}`)
      for (let i = 1; i < arts.length; i++) {
        console.log(`  - 删除: ${arts[i].title} (ID: ${arts[i].id}, 推文: ${arts[i].tweet_id})`)
        duplicates.push({
          original: arts[0],
          duplicate: arts[i],
          reason: '标题完全相同',
          similarity: 1
        })
      }
    }
  }

  // Check for content similarity (for articles with same author)
  console.log('\n检查内容相似度...')
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const a1 = articles[i]
      const a2 = articles[j]

      // Skip if already marked as duplicate
      if (duplicates.some(d => d.duplicate.id === a2.id)) continue

      // Check if same article_url
      if (a1.article_url && a2.article_url && a1.article_url === a2.article_url) {
        console.log(`[URL重复] ${a1.title} == ${a2.title}`)
        duplicates.push({
          original: a1,
          duplicate: a2,
          reason: '相同文章URL',
          similarity: 1
        })
        continue
      }

      // Check content similarity for substantial articles
      const c1 = a1.full_article_content || ''
      const c2 = a2.full_article_content || ''

      if (c1.length > 200 && c2.length > 200) {
        const similarity = calculateSimilarity(c1, c2)
        if (similarity > 0.7) {
          console.log(`[内容相似 ${Math.round(similarity * 100)}%]`)
          console.log(`  1. ${a1.title.substring(0, 50)}...`)
          console.log(`  2. ${a2.title.substring(0, 50)}...`)
          duplicates.push({
            original: a1,
            duplicate: a2,
            reason: `内容相似度 ${Math.round(similarity * 100)}%`,
            similarity
          })
        }
      }
    }
  }

  // Summary
  console.log('\n=== 汇总 ===')
  console.log(`发现 ${duplicates.length} 个重复项`)

  if (duplicates.length > 0) {
    console.log('\n重复列表:')
    duplicates.forEach((d, i) => {
      console.log(`${i + 1}. ${d.duplicate.title}`)
      console.log(`   原因: ${d.reason}`)
      console.log(`   推文ID: ${d.duplicate.tweet_id}`)
    })

    console.log('\n是否删除这些重复文章? (需要手动删除以防止误删)')
    console.log('删除SQL示例:')
    for (const d of duplicates) {
      console.log(`DELETE FROM articles WHERE id = '${d.duplicate.id}';`)
    }
  } else {
    console.log('没有发现重复文章')
  }
}

checkDuplicates().catch(console.error)

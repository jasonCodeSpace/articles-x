import { config } from 'dotenv'
config({ path: '.env.local' })

import { getArticleBySlug, fetchArticles, getPreviousArticle, getNextArticle } from '../lib/articles'

async function testFullArticleLoad() {
  console.log('Testing full article page load...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars')
    return
  }

  process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey

  try {
    // First, get a slug
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: articles } = await supabase
      .from('articles')
      .select('slug, id')
      .limit(1)

    if (!articles || articles.length === 0) {
      console.error('No articles found')
      return
    }

    const testSlug = articles[0].slug
    const testId = articles[0].id
    console.log('Test slug:', testSlug)
    console.log('Test id:', testId)
    console.log()

    // Test 1: getArticleBySlug
    console.log('Test 1: getArticleBySlug')
    try {
      const article = await getArticleBySlug(testSlug)
      if (article) {
        console.log('✓ SUCCESS: Article loaded')
        console.log('  Article keys:', Object.keys(article))
        console.log('  Has full_article_content:', !!article.full_article_content)
        console.log('  Has summary_english:', !!article.summary_english)
      } else {
        console.log('✗ FAILED: Article is null')
      }
    } catch (e: any) {
      console.error('✗ FAILED:', e.message)
    }
    console.log()

    // Test 2: fetchArticles
    console.log('Test 2: fetchArticles (for More Articles)')
    try {
      const moreArticles = await fetchArticles({ limit: 6, sort: 'newest' })
      console.log('✓ SUCCESS: Fetched', moreArticles.length, 'articles')
    } catch (e: any) {
      console.error('✗ FAILED:', e.message)
    }
    console.log()

    // Test 3: getPreviousArticle
    console.log('Test 3: getPreviousArticle')
    try {
      const prevArticle = await getPreviousArticle(testId)
      console.log('✓ SUCCESS:', prevArticle ? 'Found previous article' : 'No previous article')
    } catch (e: any) {
      console.error('✗ FAILED:', e.message)
    }
    console.log()

    // Test 4: getNextArticle
    console.log('Test 4: getNextArticle')
    try {
      const nextArticle = await getNextArticle(testId)
      console.log('✓ SUCCESS:', nextArticle ? 'Found next article' : 'No next article')
    } catch (e: any) {
      console.error('✗ FAILED:', e.message)
    }
    console.log()

    // Test 5: All together (simulating article page)
    console.log('Test 5: All article page queries together')
    try {
      const article = await getArticleBySlug(testSlug)
      if (!article) {
        console.log('✗ FAILED: Article not found')
        return
      }

      const results = await Promise.all([
        getPreviousArticle(article.id),
        getNextArticle(article.id),
        fetchArticles({ limit: 6, sort: 'newest' })
      ])

      console.log('✓ SUCCESS: All queries completed')
      console.log('  Previous:', results[0] ? 'found' : 'none')
      console.log('  Next:', results[1] ? 'found' : 'none')
      console.log('  More articles:', results[2].length)
    } catch (e: any) {
      console.error('✗ FAILED:', e.message)
      console.error('Stack:', e.stack)
    }

  } catch (e: any) {
    console.error('Error:', e.message)
  }
}

testFullArticleLoad().catch(console.error)

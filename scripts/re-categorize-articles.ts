#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { generateArticleAnalysis, generateCategories } from '@/lib/deepseek'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface ArticleToProcess {
  id: string
  title: string
  full_article_content?: string
  article_preview_text?: string
  category?: string
  language?: string
}

async function recategorizeArticles() {
  console.log('🔄 Starting article re-categorization using DeepSeek AI...')
  
  // Get articles that have categories and content to re-analyze
  const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('id, title, full_article_content, article_preview_text, category, language')
    .not('category', 'is', null)
    .not('full_article_content', 'is', null)
    .order('article_published_at', { ascending: false })
    .limit(100) // Process 100 articles at a time to avoid overwhelming the API
  
  if (fetchError) {
    console.error('❌ Error fetching articles:', fetchError)
    process.exit(1)
  }
  
  if (!articles || articles.length === 0) {
    console.log('✅ No articles found to re-categorize')
    return
  }
  
  console.log(`📊 Found ${articles.length} articles to re-categorize`)
  
  let processed = 0
  let updated = 0
  let skipped = 0
  let errors = 0
  
  for (const article of articles) {
    try {
      console.log(`\n🔍 Processing: ${article.title.substring(0, 50)}...`)
      console.log(`   Current category: ${article.category}`)
      
      // Use full content or preview text
      const content = article.full_article_content || article.article_preview_text || ''
      
      if (!content || content.length < 50) {
        console.log('   ⚠️ Skipping: insufficient content')
        skipped++
        continue
      }
      
      // Generate new analysis using DeepSeek
      const analysis = await generateArticleAnalysis(content, article.title)
      
      // Generate categories
      const categories = await generateCategories(article.title, content)
      // Take up to 2 categories and join with comma
      const selectedCategories = categories.slice(0, 2)
      const categoryString = selectedCategories.length > 0 ? selectedCategories.join(', ') : null
      
      console.log(`   🤖 AI Analysis:`)
      console.log(`      Language: ${analysis.language}`)
      if (categoryString) {
        console.log(`      New categories: ${categoryString}`)
      }
      
      // Update article with language and category
      const updateData: any = {
        language: analysis.language,
        // Also update summaries if available
        summary_chinese: analysis.summary.chinese,
        summary_english: analysis.summary.english,
        summary_generated_at: new Date().toISOString(),
        // English translations are now handled by separate translation cronjob
      }
      
      // Add categories if available
      if (categoryString) {
        updateData.category = categoryString
      }
      
      const { error: updateError } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', article.id)
      
      if (updateError) {
        console.error(`   ❌ Error updating article ${article.id}:`, updateError)
        errors++
      } else {
        console.log(`   ✅ Updated language: ${analysis.language}${categoryString ? `, categories: ${categoryString}` : ''}`)
        updated++
      }
      
      processed++
      
      // Add delay to respect API rate limits
      console.log('   ⏳ Waiting 2 seconds...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`   💥 Error processing article ${article.id}:`, error)
      errors++
    }
  }
  
  console.log(`\n📈 Re-categorization Summary:`)
  console.log(`   Processed: ${processed}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
  
  // Show updated categories
  const { data: updatedCategories } = await supabase
    .from('articles')
    .select('category')
    .not('category', 'is', null)
  
  const uniqueCategories = [...new Set(updatedCategories?.map(item => item.category) || [])]
  console.log('\n📊 Updated categories in database:')
  uniqueCategories.sort().forEach(cat => console.log(`   - ${cat}`))
}

async function main() {
  try {
    // Test DeepSeek connection first
    console.log('🧪 Testing DeepSeek API connection...')
    const testAnalysis = await generateArticleAnalysis(
      'This is a test article about Bitcoin price analysis.',
      'Bitcoin Market Update'
    )
    console.log('✅ DeepSeek API connection successful')
    console.log(`   Test result - Language: ${testAnalysis.language}`)
    
    await recategorizeArticles()
    console.log('\n🎉 Article re-categorization completed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()

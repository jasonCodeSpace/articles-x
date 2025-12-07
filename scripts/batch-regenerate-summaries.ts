#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { generateSummary } from './summarize-latest-article'
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


async function batchRegenerateSummaries() {
  try {
    console.log('🔧 Batch regenerating summaries for recent articles...')
    console.log('='.repeat(60))
    
    // 标准分类列表
    const standardCategories = [
      'Hardware',
      'Gaming',
      'Health',
      'Environment',
      'Personal Story',
  
      'Culture',
      'Philosophy',
      'History',
      'Education',
      'Design',
      'Marketing',
      'AI',
      'Crypto',
      'Tech',
      'Data',
      'Startups',
      'Business',
      'Markets',
      'Product',
      'Security',
      'Policy',
      'Science',
      'Media'
    ]
    
    // 直接查询article_main表中所有需要重新生成摘要的文章
    const { data: articles, error } = await supabase
      .from('article_main')
      .select('id, title, full_article_content, article_preview_text, article_published_at, summary_english, category')
      .not('full_article_content', 'is', null)
      .not('article_published_at', 'is', null)
      .order('article_published_at', { ascending: false })
      // 移除limit限制，处理所有文章
    
    if (error) {
      console.error('❌ Error fetching articles:', error)
      return
    }
    
    if (!articles || articles.length === 0) {
      console.log('ℹ️  No articles found that need processing')
      return
    }
    
    console.log(`📊 Found ${articles.length} articles from recent 100 that need processing`)
    
    const BATCH_SIZE = 10
    let totalSuccess = 0
    let totalErrors = 0
    
    // 分批处理文章
    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE)
      console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(articles.length / BATCH_SIZE)} (${batch.length} articles)`)
      
      const batchResults = []
      
      // 处理当前批次
      for (let j = 0; j < batch.length; j++) {
        const article = batch[j]
        const articleIndex = i + j + 1
        
        try {
          console.log(`[${articleIndex}/${articles.length}] Processing: ${article.title}`)
          
          if (!article.full_article_content || article.full_article_content.trim().length < 100) {
            console.warn('⚠️  Article content too short, skipping...')
            continue
          }
          
          // 生成新的英文摘要
          const summaryEnglish = await generateSummary(article.title, article.full_article_content)
          
          // 准备更新数据
          const updateData = {
            summary_english: summaryEnglish
          }

          batchResults.push({
            id: article.id,
            updateData
          })
          
          console.log(`✅ Generated summary for: ${article.title}`)
          
          // 短暂延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (error) {
          console.error(`❌ Error processing article ${article.id}:`, error)
          totalErrors++
        }
      }
      
      // 批量更新数据库
      if (batchResults.length > 0) {
        console.log(`💾 Updating ${batchResults.length} articles in database...`)
        
        for (const result of batchResults) {
          try {
            const { error: updateError } = await supabase
              .from('article_main')
              .update(result.updateData)
              .eq('id', result.id)
            
            if (updateError) {
              console.error(`❌ Error updating article ${result.id}:`, updateError)
              totalErrors++
            } else {
              totalSuccess++
            }
          } catch (error) {
            console.error(`❌ Database error for article ${result.id}:`, error)
            totalErrors++
          }
        }
        
        console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} completed: ${batchResults.length} articles updated`)
      }
      
      // 批次间延迟
      if (i + BATCH_SIZE < articles.length) {
        console.log('⏳ Waiting 5 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`🎉 Batch regeneration completed!`)
    console.log(`✅ Success: ${totalSuccess} articles`)
    console.log(`❌ Errors: ${totalErrors} articles`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
batchRegenerateSummaries()

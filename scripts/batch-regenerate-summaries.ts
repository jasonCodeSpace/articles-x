#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { generateArticleAnalysis } from '../lib/gemini'
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

// 清理无效翻译值的函数
function cleanTranslation(translatedText: string, fallbackText: string): string {
  const invalidValues = [
    'not provided', 'not available', 'not applicable', 'not stated', 
    'not translated', 'not given', 'not found', 'unavailable', 'missing',
    'empty', 'blank', 'no content', 'no translation', 'original text',
    'same as original', 'n/a', 'na', 'none', 'null', 'undefined'
  ];
  
  if (!translatedText || 
      translatedText.trim().length === 0 ||
      invalidValues.some(invalid => translatedText.toLowerCase().includes(invalid))) {
    return fallbackText || '';
  }
  
  return translatedText;
}

async function batchRegenerateSummaries() {
  try {
    console.log('🔧 Batch regenerating summaries for recent articles...')
    console.log('='.repeat(60))
    
    // 直接查询100篇缺少指定字段的文章，按tweet_published_at排序
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, full_article_content, article_preview_text, tweet_published_at, full_article_content_english, article_preview_text_english, title_english, summary_generated_at, summary_english, summary_chinese, category, language')
      .not('full_article_content', 'is', null)
      .not('tweet_published_at', 'is', null)
      .or('full_article_content_english.is.null,article_preview_text_english.is.null,title_english.is.null,summary_generated_at.is.null,summary_english.is.null,summary_chinese.is.null,category.is.null,language.is.null')
      .order('tweet_published_at', { ascending: false })
      .limit(100) // 获取100篇缺少字段的文章
    
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
          
          // 生成新的分析
          const analysis = await generateArticleAnalysis(article.full_article_content, article.title)
          
          // 准备更新数据
          const updateData = {
            summary_chinese: analysis.summary.chinese,
            summary_english: analysis.summary.english,
            summary_generated_at: new Date().toISOString(),
            category: analysis.category,
            language: analysis.language,
            title_english: analysis.english_translation?.title || article.title,
            article_preview_text_english: cleanTranslation(
              analysis.english_translation?.article_preview_text || '', 
              article.article_preview_text || ''
            ),
            full_article_content_english: analysis.english_translation?.full_article_content || article.full_article_content
          }

          batchResults.push({
            id: article.id,
            updateData
          })
          
          console.log(`✅ Generated summary for: ${article.title} (${analysis.category}, ${analysis.language})`)
          
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
              .from('articles')
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

#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { generateArticleAnalysis } from '../lib/gemini'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_SERVICE_ROLE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 清理无效翻译值的函数
function cleanTranslation(translatedText: string, fallbackText: string): string {
  const invalidValues = [
    'not provided', 'not available', 'not applicable', 'not stated', 
    'not translated', 'not given', 'not found', 'unavailable', 'missing',
    'empty', 'blank', 'no content', 'no translation', 'original text',
    'same as original', 'n/a', 'na', 'none', 'null', 'undefined',
    'chinese summary:', 'english summary:', 'chinese paragraph:', 'english paragraph:',
    '中文概要:', '英文总结:', '中文总结段落:'
  ];
  
  if (!translatedText || 
      translatedText.trim().length === 0 ||
      invalidValues.some(invalid => translatedText.toLowerCase().includes(invalid))) {
    return fallbackText || '';
  }
  
  return translatedText;
}

async function regenerateSummaries() {
  try {
    console.log('🔧 Regenerating summaries for recent articles...')
    console.log('='.repeat(50))
    
    // 获取最近200条有内容的文章，按tweet_published_at排序
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, full_article_content, article_preview_text, tweet_published_at')
      .not('full_article_content', 'is', null)
      .not('tweet_published_at', 'is', null)
      .order('tweet_published_at', { ascending: false })
      .limit(200)
    
    if (fetchError) {
      console.error('❌ Error fetching articles:', fetchError)
      process.exit(1)
    }
    
    if (!articles || articles.length === 0) {
      console.log('ℹ️  No articles found to regenerate')
      return
    }
    
    console.log(`📊 Found ${articles.length} articles to regenerate`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]
      
      try {
        console.log(`\n[${i + 1}/${articles.length}] Processing: ${article.title}`)
        
        if (!article.full_article_content || article.full_article_content.trim().length < 100) {
          console.warn('⚠️  Article content too short, skipping...')
          continue
        }
        
        // 生成新的分析
        const analysis = await generateArticleAnalysis(article.full_article_content, article.title)
        
        // 准备更新数据
        const updateData: {
          summary_chinese: string;
          summary_english: string;
          summary_generated_at: string;
          category: string;
          language: string;
          title_english?: string;
          article_preview_text_english?: string;
          full_article_content_english?: string;
        } = {
          summary_chinese: analysis.summary.chinese,
          summary_english: analysis.summary.english,
          summary_generated_at: new Date().toISOString(),
          category: analysis.category,
          language: analysis.language
        }

        // 始终添加英文翻译字段
        if (analysis.english_translation) {
          updateData.title_english = cleanTranslation(analysis.english_translation.title, article.title);
          updateData.article_preview_text_english = cleanTranslation(analysis.english_translation.article_preview_text, article.article_preview_text || '');
          updateData.full_article_content_english = cleanTranslation(analysis.english_translation.full_article_content, article.full_article_content);
        } else {
          // 如果没有翻译，使用原文
          updateData.title_english = article.title;
          updateData.article_preview_text_english = article.article_preview_text || '';
          updateData.full_article_content_english = article.full_article_content;
        }

        // 验证总结内容
        if (updateData.summary_chinese.includes('Chinese') || updateData.summary_chinese.includes('Summary') ||
            updateData.summary_english.includes('中文') || updateData.summary_english.includes('总结')) {
          console.warn('⚠️  Summary contains format markers, cleaning...')
          
          // 清理格式标记
          updateData.summary_chinese = updateData.summary_chinese
            .replace(/\*\*Chinese Summary:\*\*/gi, '')
            .replace(/\*\*中文总结段落:\*\*/gi, '')
            .replace(/Chinese Summary:/gi, '')
            .replace(/中文总结段落:/gi, '')
            .replace(/\*\*/g, '')
            .trim()
          
          updateData.summary_english = updateData.summary_english
            .replace(/\*\*English Summary:\*\*/gi, '')
            .replace(/\*\*English Paragraph:\*\*/gi, '')
            .replace(/English Summary:/gi, '')
            .replace(/English paragraph:/gi, '')
            .replace(/\*\*/g, '')
            .trim()
        }
        
        // 更新数据库
        const { error: updateError } = await supabase
          .from('articles')
          .update(updateData)
          .eq('id', article.id)
        
        if (updateError) {
          console.error(`❌ Error updating article ${article.id}:`, updateError)
          errorCount++
        } else {
          successCount++
          console.log(`✅ Successfully regenerated summary for: ${article.title}`)
          console.log(`   Category: ${analysis.category}, Language: ${analysis.language}`)
        }
        
        // 添加延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.error(`❌ Error processing article ${article.id}:`, error)
        errorCount++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log(`🎉 Regeneration completed!`)
    console.log(`✅ Success: ${successCount} articles`)
    console.log(`❌ Errors: ${errorCount} articles`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
regenerateSummaries()

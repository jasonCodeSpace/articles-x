import { createClient } from '@supabase/supabase-js'
import { generateArticleAnalysis } from '../lib/gemini'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixFailedTranslations() {
  console.log('🔧 开始修复失败的翻译...')
  
  try {
    // 获取缺少英文翻译的文章
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, tweet_text, article_preview_text, full_article_content, language')
      .not('full_article_content', 'is', null)
      .not('tweet_published_at', 'is', null)
      .or('title_english.is.null,article_preview_text_english.is.null,full_article_content_english.is.null')
      .order('tweet_published_at', { ascending: false })
      .limit(50) // 处理最多50篇失败的文章
    
    if (fetchError) {
      console.error('❌ 获取文章失败:', fetchError)
      return
    }
    
    if (!articles || articles.length === 0) {
      console.log('✅ 没有需要修复的文章')
      return
    }
    
    console.log(`📝 找到 ${articles.length} 篇需要修复翻译的文章`)
    
    // 分批处理文章
    const batchSize = 5
    const batches = Math.ceil(articles.length / batchSize)
    
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const startIndex = batchIndex * batchSize
      const endIndex = Math.min(startIndex + batchSize, articles.length)
      const batch = articles.slice(startIndex, endIndex)
      
      console.log(`\n📦 处理批次 ${batchIndex + 1}/${batches} (文章 ${startIndex + 1}-${endIndex})...`)
      
      const batchUpdates = []
      
      for (let i = 0; i < batch.length; i++) {
        const article = batch[i]
        const articleIndex = startIndex + i + 1
        
        console.log(`\n🔄 处理文章 ${articleIndex}/${articles.length}: ${article.title.substring(0, 50)}...`)
        
        try {
          // 使用 Gemini 分析文章，带重试机制
          let analysis = null
          let retryCount = 0
          const maxRetries = 3
          
          while (retryCount < maxRetries && !analysis) {
            try {
              analysis = await generateArticleAnalysis(
                article.full_article_content,
                article.title
              )
              break
            } catch (error) {
              retryCount++
              console.log(`⚠️ 重试 ${retryCount}/${maxRetries}: ${article.title.substring(0, 50)}...`)
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 5000 * retryCount)) // 递增延迟
              } else {
                throw error
              }
            }
          }
          
          if (analysis) {
            // 准备更新数据
            const updateData: any = {
              language: analysis.language,
              category: analysis.category,
              article_summary_chinese: analysis.summary.chinese,
              article_summary_english: analysis.summary.english
            }
            
            // 只有当检测到非英文语言时才添加英文翻译
            if (analysis.language !== 'en' && analysis.english_translation) {
              if (analysis.english_translation.title) {
                updateData.title_english = analysis.english_translation.title
              }
              if (analysis.english_translation.article_preview_text) {
                updateData.article_preview_text_english = analysis.english_translation.article_preview_text
              }
              if (analysis.english_translation.full_article_content) {
                updateData.full_article_content_english = analysis.english_translation.full_article_content
              }
            }
            
            batchUpdates.push({
              id: article.id,
              ...updateData
            })
            
            console.log(`✅ 分析完成: ${article.title.substring(0, 50)}...`)
          } else {
            console.log(`⚠️ 分析失败: ${article.title.substring(0, 50)}...`)
          }
        } catch (error) {
          console.error(`❌ 处理文章失败 ${article.title.substring(0, 50)}:`, error)
        }
        
        // 添加延迟避免API限制
        if (i < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      // 批量更新到 Supabase
      if (batchUpdates.length > 0) {
        console.log(`\n📤 上传批次数据到Supabase (${batchUpdates.length} 篇文章)...`)
        
        let successCount = 0
        let failCount = 0
        
        for (const update of batchUpdates) {
          try {
            const { error: updateError } = await supabase
              .from('articles')
              .update(update)
              .eq('id', update.id)
            
            if (updateError) {
              console.error(`❌ 更新文章失败 ${update.id}:`, updateError)
              failCount++
            } else {
              successCount++
            }
          } catch (error) {
            console.error(`❌ 更新文章异常 ${update.id}:`, error)
            failCount++
          }
        }
        
        console.log(`✅ 批次上传完成: 成功 ${successCount} 篇，失败 ${failCount} 篇`)
      }
      
      // 批次间延迟
      if (batchIndex < batches - 1) {
        console.log('⏳ 等待5秒后处理下一批次...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    
    console.log('\n🎉 修复翻译任务完成！')
    
  } catch (error) {
    console.error('❌ 修复翻译过程中发生错误:', error)
  }
}

// 运行脚本
fixFailedTranslations().catch(console.error)
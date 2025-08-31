import { createClient } from '@supabase/supabase-js'
import { generateArticleAnalysis } from '../lib/gemini'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function translateExistingArticles() {
  console.log('🚀 开始为最近100篇文章重新生成英文翻译...')
  
  try {
    // 获取最近的100篇文章（按tweet_published_at排序）
     const { data: articles, error: fetchError } = await supabase
       .from('articles')
       .select('id, title, tweet_text, article_preview_text, full_article_content, language, title_english')
       .not('full_article_content', 'is', null)
       .not('tweet_published_at', 'is', null)
       .order('tweet_published_at', { ascending: false })
       .limit(100) // 处理最近100篇文章
    
    if (fetchError) {
      console.error('❌ 获取文章失败:', fetchError)
      return
    }
    
    if (!articles || articles.length === 0) {
      console.log('✅ 所有文章都已有英文翻译')
      return
    }
    
    console.log(`📝 找到 ${articles.length} 篇需要翻译的文章`)
    
    const results = []
    const errors = []
    const batchSize = 10
    
    // 分批处理文章
    for (let batchStart = 0; batchStart < articles.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, articles.length)
      const batch = articles.slice(batchStart, batchEnd)
      
      console.log(`\n📦 处理批次 ${Math.floor(batchStart / batchSize) + 1}/${Math.ceil(articles.length / batchSize)} (文章 ${batchStart + 1}-${batchEnd})...`)
      
      const batchResults = []
      const batchErrors = []
      
      for (let i = 0; i < batch.length; i++) {
        const article = batch[i]
        const globalIndex = batchStart + i
        
        try {
          console.log(`\n🔄 处理文章 ${globalIndex + 1}/${articles.length}: ${article.title?.substring(0, 50)}...`)
          
          if (!article.full_article_content) {
            console.log('⚠️  跳过：文章内容为空')
            continue
          }
          
          // 使用Gemini重新生成分析和翻译
          const analysis = await generateArticleAnalysis(article.full_article_content, article.title)
          
          // 准备更新数据
          const updateData: any = {}
          
          // 如果有英文翻译，添加翻译字段
          if (analysis.english_translation) {
            updateData.title_english = analysis.english_translation.title
            updateData.article_preview_text_english = analysis.english_translation.article_preview_text
            updateData.full_article_content_english = analysis.english_translation.full_article_content
          } else if (analysis.language === 'en') {
            // 如果文章本身就是英文，直接复制原内容
            updateData.title_english = article.title
            updateData.article_preview_text_english = article.article_preview_text || ''
            updateData.full_article_content_english = article.full_article_content
          }
          
          // 同时更新语言和分类信息
          if (analysis.language) {
            updateData.language = analysis.language
          }
          if (analysis.category) {
            updateData.category = analysis.category
          }
          
          batchResults.push({
            articleId: article.id,
            updateData,
            title: article.title,
            language: analysis.language,
            hasTranslation: !!analysis.english_translation
          })
          
          console.log(`✅ 分析完成: ${article.title?.substring(0, 50)}...`)
          
          // 添加延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 2000))
          
        } catch (error) {
          console.error(`❌ 分析文章失败 ${article.id}:`, error)
          batchErrors.push({
            articleId: article.id,
            title: article.title,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      // 批量上传到Supabase
      if (batchResults.length > 0) {
        console.log(`\n📤 上传批次数据到Supabase (${batchResults.length} 篇文章)...`)
        
        let uploadSuccess = 0
        let uploadFailed = 0
        
        for (const result of batchResults) {
          try {
            const { error: updateError } = await supabase
              .from('articles')
              .update(result.updateData)
              .eq('id', result.articleId)
            
            if (updateError) {
              console.error(`❌ 上传失败 ${result.articleId}:`, updateError)
              batchErrors.push({
                articleId: result.articleId,
                title: result.title,
                error: updateError.message
              })
              uploadFailed++
            } else {
              results.push(result)
              uploadSuccess++
            }
          } catch (error) {
            console.error(`❌ 上传异常 ${result.articleId}:`, error)
            batchErrors.push({
              articleId: result.articleId,
              title: result.title,
              error: error instanceof Error ? error.message : 'Upload exception'
            })
            uploadFailed++
          }
        }
        
        console.log(`✅ 批次上传完成: 成功 ${uploadSuccess} 篇，失败 ${uploadFailed} 篇`)
        
        // 如果上传失败率过高，暂停处理
        if (uploadFailed > uploadSuccess && uploadFailed > 3) {
          console.error('❌ 上传失败率过高，暂停处理')
          errors.push(...batchErrors)
          break
        }
      }
      
      errors.push(...batchErrors)
      
      // 批次间延迟
      if (batchEnd < articles.length) {
        console.log('⏳ 等待5秒后处理下一批次...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    
    // 输出结果统计
    console.log('\n📊 处理结果统计:')
    console.log(`✅ 成功处理: ${results.length} 篇文章`)
    console.log(`❌ 处理失败: ${errors.length} 篇文章`)
    
    if (results.length > 0) {
      console.log('\n✅ 成功处理的文章:')
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.title?.substring(0, 60)}... (${result.language}, 翻译: ${result.hasTranslation ? '是' : '否'})`)
      })
    }
    
    if (errors.length > 0) {
      console.log('\n❌ 处理失败的文章:')
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.title?.substring(0, 60)}... - ${error.error}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error)
  }
}

// 运行脚本
if (require.main === module) {
  translateExistingArticles()
    .then(() => {
      console.log('\n🎉 翻译脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error)
      process.exit(1)
    })
}

export { translateExistingArticles }
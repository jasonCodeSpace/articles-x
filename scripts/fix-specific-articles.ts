import { createClient } from '@supabase/supabase-js'
import { generateArticleAnalysis } from '../lib/gemini'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 用户提到的3篇失败文章的标题
const targetTitles = [
  '可能是最重要的一次本周复盘',
  '那么，ai 到底是怎么识别"猫"的？| 8岁小孩也能懂的五星级科普',
  '11 年前的今天，那个可能是中本聪的人被遗体冷冻'
]

async function fixSpecificArticles() {
  console.log('🎯 开始修复指定的3篇文章翻译...')
  
  try {
    for (let i = 0; i < targetTitles.length; i++) {
      const title = targetTitles[i]
      console.log(`\n🔄 处理文章 ${i + 1}/3: ${title}`)
      
      // 获取文章数据
      const { data: articles, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, tweet_text, article_preview_text, full_article_content, language')
        .eq('title', title)
        .limit(1)
      
      if (fetchError) {
        console.error(`❌ 获取文章失败: ${title}`, fetchError)
        continue
      }
      
      if (!articles || articles.length === 0) {
        console.log(`⚠️ 未找到文章: ${title}`)
        continue
      }
      
      const article = articles[0]
      console.log(`📝 找到文章，开始分析...`)
      
      try {
        // 使用 Gemini 分析文章，带重试机制
        let analysis = null
        let retryCount = 0
        const maxRetries = 3
        
        while (retryCount < maxRetries && !analysis) {
          try {
            console.log(`🤖 调用 Gemini API (尝试 ${retryCount + 1}/${maxRetries})...`)
            analysis = await generateArticleAnalysis(
              article.full_article_content,
              article.title
            )
            break
          } catch (error) {
            retryCount++
            console.log(`⚠️ API 调用失败，重试 ${retryCount}/${maxRetries}...`)
            if (retryCount < maxRetries) {
              const delay = 10000 * retryCount // 10秒, 20秒, 30秒
              console.log(`⏳ 等待 ${delay/1000} 秒后重试...`)
              await new Promise(resolve => setTimeout(resolve, delay))
            } else {
              throw error
            }
          }
        }
        
        if (analysis) {
          console.log(`✅ 分析成功，语言: ${analysis.language}, 分类: ${analysis.category}`)
          
          // 准备更新数据
          const updateData: any = {
            language: analysis.language,
            category: analysis.category,
            article_summary_chinese: analysis.summary.chinese,
            article_summary_english: analysis.summary.english
          }
          
          // 只有当检测到非英文语言时才添加英文翻译
          if (analysis.language !== 'en' && analysis.english_translation) {
            console.log('📝 添加英文翻译...')
            if (analysis.english_translation.title) {
              updateData.title_english = analysis.english_translation.title
              console.log(`   标题: ${analysis.english_translation.title.substring(0, 50)}...`)
            }
            if (analysis.english_translation.article_preview_text) {
              updateData.article_preview_text_english = analysis.english_translation.article_preview_text
              console.log(`   预览: ${analysis.english_translation.article_preview_text.substring(0, 50)}...`)
            }
            if (analysis.english_translation.full_article_content) {
              updateData.full_article_content_english = analysis.english_translation.full_article_content
              console.log(`   内容: ${analysis.english_translation.full_article_content.substring(0, 50)}...`)
            }
          }
          
          // 更新到数据库
          console.log('💾 更新数据库...')
          const { error: updateError } = await supabase
            .from('articles')
            .update(updateData)
            .eq('id', article.id)
          
          if (updateError) {
            console.error(`❌ 更新数据库失败: ${title}`, updateError)
          } else {
            console.log(`✅ 成功更新文章: ${title}`)
          }
        } else {
          console.log(`❌ 分析失败: ${title}`)
        }
      } catch (error) {
        console.error(`❌ 处理文章失败: ${title}`, error)
      }
      
      // 文章间延迟
      if (i < targetTitles.length - 1) {
        console.log('⏳ 等待15秒后处理下一篇文章...')
        await new Promise(resolve => setTimeout(resolve, 15000))
      }
    }
    
    console.log('\n🎉 指定文章修复任务完成！')
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error)
  }
}

// 运行脚本
fixSpecificArticles().catch(console.error)
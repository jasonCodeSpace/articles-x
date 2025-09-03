import dotenv from 'dotenv'
import { generateArticleAnalysis } from '../lib/gemini'
import { createServiceClient } from '../lib/supabase/service'

// 加载环境变量
dotenv.config({ path: '.env.local' })

async function testSingleArticle() {
  try {
    console.log('开始测试单篇文章分类...')
    
    const supabase = createServiceClient()
    
    // 测试第一篇文章：PumpFun 到 Hyperliquid（应该是 Crypto, Tech，不应该包含 Business）
    const title1 = "从 PumpFun 到 Hyperliquid：为何「回购销毁」在价值分配方面优于「收益共享」？";
    
    // 测试第二篇文章：大麻个人故事（应该是 Personal Story, Culture，不应该包含 Tech）
    const title2 = "Weed Made Me Creative… and Destroyed My Life";
    
    // 查找第一篇文章
    const { data: article, error } = await supabase
      .from('articles')
      .select('id, title, full_article_content')
      .ilike('title', '%PumpFun%Hyperliquid%')
      .single()
    
    // 测试第一篇文章
    console.log('=== 测试文章 1: PumpFun 到 Hyperliquid ===')
    if (article) {
      console.log('找到文章:', article.title)
      try {
        const analysis1 = await generateArticleAnalysis(article.full_article_content || '', article.title)
        console.log('分类:', analysis1.category)
        console.log('预期: Crypto, Tech (不应包含 Business)')
        console.log('')
      } catch (error) {
        console.error('分析失败:', error)
      }
    } else {
      console.log('未找到 PumpFun 文章')
    }

    // 测试第二篇文章
    console.log('=== 测试文章 2: Weed Made Me Creative ===')
    const { data: article2, error: error2 } = await supabase
      .from('articles')
      .select('id, title, full_article_content')
      .ilike('title', '%Weed Made Me Creative%')
      .single()

    if (article2) {
      console.log('找到文章:', article2.title)
      try {
        const analysis2 = await generateArticleAnalysis(article2.full_article_content || '', article2.title)
        console.log('分类:', analysis2.category)
        console.log('预期: Personal Story, Culture (不应包含 Tech)')
        console.log('')
      } catch (error) {
        console.error('分析失败:', error)
      }
    } else {
      console.log('未找到 Weed 文章')
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

testSingleArticle()
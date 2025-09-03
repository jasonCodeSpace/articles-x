import { createServiceClient } from '@/lib/supabase/service'
import { generateArticleAnalysis } from '@/lib/gemini'

interface Article {
  id: string
  title: string
  full_article_content: string
  category?: string
}

/**
 * 分析所有文章的分类并更新数据库
 */
export async function analyzeArticleCategories() {
  const supabase = createServiceClient()
  
  try {
    console.log('开始分析文章分类...')
    
    // 获取最近1000篇文章进行分析（包括已有分类的文章）
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, full_article_content, category, tweet_published_at')
      .not('full_article_content', 'is', null)
      .not('full_article_content', 'eq', '')
      .order('tweet_published_at', { ascending: false })
      .limit(1000)
    
    if (fetchError) {
      console.error('获取文章失败:', fetchError)
      return
    }
    
    if (!articles || articles.length === 0) {
      console.log('没有找到需要分析的文章')
      return
    }

    console.log(`找到 ${articles.length} 篇需要分析的文章`)
    console.log('前5篇文章:')
    articles.slice(0, 5).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} (${article.tweet_published_at})`)
    })
    
    const batchSize = 10
    let processedCount = 0
    let successCount = 0
    let errorCount = 0
    
    // 分批处理文章
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize)
      console.log(`\n处理第 ${Math.floor(i / batchSize) + 1} 批文章 (${i + 1}-${Math.min(i + batchSize, articles.length)})...`)
      
      const updates: Array<{ id: string; category: string }> = []
      
      // 分析每篇文章
      for (const article of batch) {
        try {
          console.log(`分析文章: ${article.title.substring(0, 50)}...`)
          
          // 使用Gemini分析文章
          const analysis = await generateArticleAnalysis(
            article.full_article_content,
            article.title
          )
          
          if (analysis.category) {
            updates.push({
              id: article.id,
              category: analysis.category
            })
            console.log(`✓ 分类: ${analysis.category}`)
            successCount++
          } else {
            console.log('✗ 未能确定分类')
            errorCount++
          }
          
          processedCount++
          
          // 添加延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 1000))
          
        } catch (error) {
          console.error(`分析文章失败 (${article.id}):`, error)
          errorCount++
          processedCount++
        }
      }
      
      // 批量更新数据库
      if (updates.length > 0) {
        console.log(`\n更新 ${updates.length} 篇文章的分类...`)
        
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('articles')
            .update({ category: update.category })
            .eq('id', update.id)
          
          if (updateError) {
            console.error(`更新文章 ${update.id} 失败:`, updateError)
          } else {
            console.log(`✓ 已更新文章 ${update.id} 分类为: ${update.category}`)
          }
        }
      }
      
      console.log(`\n批次完成。已处理: ${processedCount}/${articles.length}, 成功: ${successCount}, 失败: ${errorCount}`)
      
      // 批次间添加延迟
      if (i + batchSize < articles.length) {
        console.log('等待 3 秒后继续下一批...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }
    
    console.log('\n=== 分析完成 ===')
    console.log(`总计处理: ${processedCount} 篇文章`)
    console.log(`成功分类: ${successCount} 篇`)
    console.log(`失败: ${errorCount} 篇`)
    
  } catch (error) {
    console.error('分析过程中发生错误:', error)
  }
}

/**
 * 重新分析所有文章的分类（包括已有分类的文章）
 */
export async function reanalyzeAllArticleCategories() {
  const supabase = createServiceClient()
  
  try {
    console.log('开始重新分析所有文章分类...')
    
    // 获取所有文章
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, full_article_content, category')
      .not('full_article_content', 'is', null)
      .not('full_article_content', 'eq', '')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('获取文章失败:', fetchError)
      return
    }
    
    if (!articles || articles.length === 0) {
      console.log('没有找到文章')
      return
    }
    
    console.log(`找到 ${articles.length} 篇文章需要重新分析`)
    
    const batchSize = 10
    let processedCount = 0
    let successCount = 0
    let errorCount = 0
    
    // 分批处理文章
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize)
      console.log(`\n处理第 ${Math.floor(i / batchSize) + 1} 批文章 (${i + 1}-${Math.min(i + batchSize, articles.length)})...`)
      
      const updates: Array<{ id: string; category: string; oldCategory?: string }> = []
      
      // 分析每篇文章
      for (const article of batch) {
        try {
          console.log(`重新分析文章: ${article.title.substring(0, 50)}...`)
          console.log(`当前分类: ${article.category || '无'}`)
          
          // 使用Gemini分析文章
          const analysis = await generateArticleAnalysis(
            article.full_article_content,
            article.title
          )
          
          if (analysis.category) {
            updates.push({
              id: article.id,
              category: analysis.category,
              oldCategory: article.category
            })
            console.log(`✓ 新分类: ${analysis.category}`)
            successCount++
          } else {
            console.log('✗ 未能确定分类')
            errorCount++
          }
          
          processedCount++
          
          // 添加延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 1000))
          
        } catch (error) {
          console.error(`分析文章失败 (${article.id}):`, error)
          errorCount++
          processedCount++
        }
      }
      
      // 批量更新数据库
      if (updates.length > 0) {
        console.log(`\n更新 ${updates.length} 篇文章的分类...`)
        
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('articles')
            .update({ category: update.category })
            .eq('id', update.id)
          
          if (updateError) {
            console.error(`更新文章 ${update.id} 失败:`, updateError)
          } else {
            const changeInfo = update.oldCategory 
              ? `${update.oldCategory} → ${update.category}`
              : `无 → ${update.category}`
            console.log(`✓ 已更新文章 ${update.id} 分类: ${changeInfo}`)
          }
        }
      }
      
      console.log(`\n批次完成。已处理: ${processedCount}/${articles.length}, 成功: ${successCount}, 失败: ${errorCount}`)
      
      // 批次间添加延迟
      if (i + batchSize < articles.length) {
        console.log('等待 3 秒后继续下一批...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }
    
    console.log('\n=== 重新分析完成 ===')
    console.log(`总计处理: ${processedCount} 篇文章`)
    console.log(`成功分类: ${successCount} 篇`)
    console.log(`失败: ${errorCount} 篇`)
    
  } catch (error) {
    console.error('重新分析过程中发生错误:', error)
  }
}

/**
 * 分析特定分类的文章统计
 */
export async function analyzeCategoryStats() {
  const supabase = createServiceClient()
  
  try {
    console.log('分析分类统计...')
    
    const { data: stats, error } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null)
      .not('category', 'eq', '')
    
    if (error) {
      console.error('获取分类统计失败:', error)
      return
    }
    
    if (!stats || stats.length === 0) {
      console.log('没有找到已分类的文章')
      return
    }
    
    // 统计每个分类的文章数量
    const categoryCount: Record<string, number> = {}
    
    stats.forEach((article: { category?: string }) => {
      if (article.category) {
        // 处理多个分类的情况（用逗号分隔）
        const categories = article.category.split(',').map((cat: string) => cat.trim())
        categories.forEach((category: string) => {
          categoryCount[category] = (categoryCount[category] || 0) + 1
        })
      }
    })
    
    // 按文章数量排序
    const sortedCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
    
    console.log('\n=== 分类统计 ===')
    console.log(`总计已分类文章: ${stats.length} 篇`)
    console.log(`分类数量: ${sortedCategories.length} 个\n`)
    
    sortedCategories.forEach(([category, count]) => {
      console.log(`${category}: ${count} 篇`)
    })
    
  } catch (error) {
    console.error('分析分类统计时发生错误:', error)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const command = process.argv[2]
  
  switch (command) {
    case 'analyze':
      analyzeArticleCategories()
      break
    case 'reanalyze':
      reanalyzeAllArticleCategories()
      break
    case 'stats':
      analyzeCategoryStats()
      break
    default:
      console.log('使用方法:')
      console.log('  npm run ts-node scripts/analyze-article-categories.ts analyze    # 分析未分类的文章')
      console.log('  npm run ts-node scripts/analyze-article-categories.ts reanalyze  # 重新分析所有文章')
      console.log('  npm run ts-node scripts/analyze-article-categories.ts stats     # 查看分类统计')
  }
}
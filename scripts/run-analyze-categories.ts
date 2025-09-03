#!/usr/bin/env tsx

// 加载环境变量
import { config } from 'dotenv'
config({ path: '.env.local' })

import { analyzeArticleCategories } from './analyze-article-categories'

/**
 * 执行文章分类分析
 * 分析最近1500篇没有分类的文章
 */
async function main() {
  try {
    console.log('开始执行文章分类分析...')
    await analyzeArticleCategories()
    console.log('文章分类分析完成！')
  } catch (error) {
    console.error('执行失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本则执行main函数
if (require.main === module) {
  main()
}
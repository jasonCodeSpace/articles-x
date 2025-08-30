const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function updateArticleCategories() {
  try {
    console.log('开始更新文章分类...');
    
    // 初始化Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // 读取tags.csv文件
    const csvContent = fs.readFileSync('tags.csv', 'utf8');
    const lines = csvContent.trim().split('\n');
    
    // 解析作者和分类映射
    const authorCategories = new Map();
    
    for (const line of lines) {
      if (line.trim()) {
        const [author, categories] = line.split(': ');
        if (author && categories) {
          authorCategories.set(author.trim(), categories.trim());
        }
      }
    }
    
    console.log(`解析了 ${authorCategories.size} 个作者的分类信息`);
    
    // 批量更新文章分类
    let updatedCount = 0;
    let batchSize = 100;
    
    for (const [authorHandle, category] of authorCategories) {
      const { data, error } = await supabase
        .from('articles')
        .update({ category: category })
        .eq('author_handle', authorHandle);
      
      if (error) {
        console.error(`更新作者 ${authorHandle} 的文章分类时出错:`, error);
      } else {
        console.log(`已更新作者 ${authorHandle} 的文章分类为: ${category}`);
        updatedCount++;
      }
      
      // 添加小延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`\n更新完成! 共处理了 ${updatedCount} 个作者的文章分类`);
    
    // 验证更新结果
    const { data: stats, error: statsError } = await supabase
      .from('articles')
      .select('category, author_handle')
      .not('category', 'is', null);
    
    if (statsError) {
      console.error('获取统计信息时出错:', statsError);
    } else {
      const categoryStats = {};
      stats.forEach(article => {
        if (article.category) {
          categoryStats[article.category] = (categoryStats[article.category] || 0) + 1;
        }
      });
      
      console.log('\n分类统计:');
      Object.entries(categoryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([category, count]) => {
          console.log(`${category}: ${count} 篇文章`);
        });
    }
    
  } catch (err) {
    console.error('更新分类失败:', err);
  }
}

updateArticleCategories();
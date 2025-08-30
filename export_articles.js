const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportArticles() {
  try {
    console.log('开始导出文章数据...');
    
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    
    while (true) {
      // 分批获取数据
      const { data, error } = await supabase
        .from('articles')
        .select('article_preview_text, author_handle')
        .order('updated_at', { ascending: false })
        .range(from, from + batchSize - 1);
      
      if (error) {
        console.error('查询错误:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        break;
      }
      
      allData = allData.concat(data);
      console.log(`已获取 ${allData.length} 条记录`);
      
      if (data.length < batchSize) {
        break;
      }
      
      from += batchSize;
    }
    
    console.log(`总共获取 ${allData.length} 条记录`);
    
    // 保存到JSON文件
    const jsonData = JSON.stringify(allData, null, 2);
    fs.writeFileSync('article_preview_data.json', jsonData, 'utf8');
    
    console.log('数据已保存到 article_preview_data.json');
    console.log(`总共导出 ${allData.length} 条记录`);
    
  } catch (err) {
    console.error('导出失败:', err);
  }
}

exportArticles();
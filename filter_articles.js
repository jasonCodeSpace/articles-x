const fs = require('fs');

async function filterArticlesByAuthor() {
  try {
    console.log('开始过滤文章数据...');
    
    // 读取原始数据
    const rawData = fs.readFileSync('article_preview_data.json', 'utf8');
    const articles = JSON.parse(rawData);
    
    console.log(`原始数据包含 ${articles.length} 条记录`);
    
    // 使用Map来跟踪每个作者的文章数量
    const authorCounts = new Map();
    const filteredArticles = [];
    
    // 遍历文章，每个作者最多保留5条
    for (const article of articles) {
      const authorHandle = article.author_handle;
      const currentCount = authorCounts.get(authorHandle) || 0;
      
      if (currentCount < 5) {
        filteredArticles.push(article);
        authorCounts.set(authorHandle, currentCount + 1);
      }
    }
    
    console.log(`过滤后数据包含 ${filteredArticles.length} 条记录`);
    console.log(`涉及 ${authorCounts.size} 个不同的作者`);
    
    // 保存过滤后的数据
    const jsonData = JSON.stringify(filteredArticles, null, 2);
    fs.writeFileSync('article_preview_data.json', jsonData, 'utf8');
    
    console.log('数据已保存到 article_preview_data.json');
    
    // 显示统计信息
    const authorStats = Array.from(authorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    console.log('\n前10个作者的文章数量:');
    authorStats.forEach(([author, count]) => {
      console.log(`${author}: ${count} 条`);
    });
    
  } catch (err) {
    console.error('过滤失败:', err);
  }
}

filterArticlesByAuthor();
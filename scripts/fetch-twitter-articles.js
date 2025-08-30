// 获取Twitter文章推文的脚本
const fs = require('fs');
const path = require('path');
const https = require('https');

// Twitter API配置
const TWITTER_API_CONFIG = {
  host: 'twitter241.p.rapidapi.com',
  headers: {
    'x-rapidapi-host': 'twitter241.p.rapidapi.com',
    'x-rapidapi-key': 'ab9b25a33dmsh9bbd3a16233f27dp1d0125jsn3cc5b2112be6'
  }
};

// 读取新账号列表
function loadNewAccounts() {
  try {
    const filePath = path.join(__dirname, 'new-accounts.json');
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('读取新账号列表失败:', error);
    return [];
  }
}

// 调用Twitter API搜索文章
function searchTwitterArticles(username) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(`from:${username} article`);
    const path = `/search?type=Top&count=20&query=${query}`;
    
    const options = {
      hostname: TWITTER_API_CONFIG.host,
      path: path,
      method: 'GET',
      headers: TWITTER_API_CONFIG.headers
    };
    
    console.log(`正在搜索 @${username} 的文章推文...`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`@${username}: 获取到 ${response.result?.timeline?.instructions?.[0]?.entries?.length || 0} 条推文`);
          resolve({
            username,
            success: true,
            data: response
          });
        } catch (error) {
          console.error(`解析 @${username} 响应失败:`, error);
          resolve({
            username,
            success: false,
            error: error.message,
            rawData: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`请求 @${username} 失败:`, error);
      resolve({
        username,
        success: false,
        error: error.message
      });
    });
    
    req.end();
  });
}

// 从推文数据中提取所需字段
function extractTweetData(tweetEntry, username) {
  try {
    const tweet = tweetEntry.content?.itemContent?.tweet_results?.result;
    if (!tweet) return null;
    
    const legacy = tweet.legacy;
    if (!legacy) return null;
    
    // 检查是否包含文章链接或相关关键词
    const fullText = legacy.full_text || '';
    const hasArticleKeyword = fullText.toLowerCase().includes('article') || 
                             fullText.includes('https://') ||
                             fullText.length > 200; // 长推文通常是文章
    
    if (!hasArticleKeyword) return null;
    
    return {
      tweet_id: legacy.id_str,
      author_handle: username,
      is_article: true,
      created_at: new Date(legacy.created_at).toISOString(),
      updated_at: new Date().toISOString(),
      full_text: fullText,
      retweet_count: legacy.retweet_count || 0,
      favorite_count: legacy.favorite_count || 0,
      reply_count: legacy.reply_count || 0
    };
  } catch (error) {
    console.error('提取推文数据失败:', error);
    return null;
  }
}

// 处理单个账号
async function processAccount(username) {
  try {
    const result = await searchTwitterArticles(username);
    
    if (!result.success) {
      return {
        username,
        success: false,
        error: result.error,
        articles: []
      };
    }
    
    const timeline = result.data.result?.timeline;
    if (!timeline) {
      return {
        username,
        success: false,
        error: 'No timeline data',
        articles: []
      };
    }
    
    const entries = timeline.instructions?.[0]?.entries || [];
    const articles = [];
    
    for (const entry of entries) {
      if (entry.entryId?.startsWith('tweet-')) {
        const tweetData = extractTweetData(entry, username);
        if (tweetData) {
          articles.push(tweetData);
        }
      }
    }
    
    return {
      username,
      success: true,
      articles,
      totalTweets: entries.length
    };
    
  } catch (error) {
    console.error(`处理账号 @${username} 时出错:`, error);
    return {
      username,
      success: false,
      error: error.message,
      articles: []
    };
  }
}

// 主函数
async function main() {
  console.log('开始获取Twitter文章推文数据...');
  
  const newAccounts = loadNewAccounts();
  console.log(`需要处理的账号数量: ${newAccounts.length}`);
  
  const results = [];
  const allArticles = [];
  
  // 逐个处理账号，避免API限制
  for (let i = 0; i < newAccounts.length; i++) {
    const username = newAccounts[i];
    console.log(`\n处理进度: ${i + 1}/${newAccounts.length} - @${username}`);
    
    const result = await processAccount(username);
    results.push(result);
    
    if (result.success && result.articles.length > 0) {
      allArticles.push(...result.articles);
      console.log(`✓ @${username}: 找到 ${result.articles.length} 篇文章`);
    } else {
      console.log(`✗ @${username}: ${result.error || '未找到文章'}`);
    }
    
    // 添加延迟避免API限制
    if (i < newAccounts.length - 1) {
      console.log('等待2秒...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // 保存结果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // 保存详细结果
  fs.writeFileSync(
    path.join(__dirname, `twitter-fetch-results-${timestamp}.json`),
    JSON.stringify(results, null, 2)
  );
  
  // 保存文章数据
  fs.writeFileSync(
    path.join(__dirname, `twitter-articles-${timestamp}.json`),
    JSON.stringify(allArticles, null, 2)
  );
  
  // 统计信息
  const successCount = results.filter(r => r.success).length;
  const totalArticles = allArticles.length;
  
  console.log('\n=== 获取完成 ===');
  console.log(`成功处理的账号: ${successCount}/${newAccounts.length}`);
  console.log(`总共获取的文章: ${totalArticles}`);
  console.log(`结果已保存到:`);
  console.log(`- twitter-fetch-results-${timestamp}.json`);
  console.log(`- twitter-articles-${timestamp}.json`);
  
  return {
    results,
    allArticles,
    stats: {
      totalAccounts: newAccounts.length,
      successfulAccounts: successCount,
      totalArticles
    }
  };
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, processAccount, extractTweetData };
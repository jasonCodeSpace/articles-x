import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// 读取已获取的推文ID列表
const articlesFile = 'twitter-articles-2025-08-30T09-04-17-974Z.json';
const articlesPath = path.join(process.cwd(), 'scripts', articlesFile);

if (!fs.existsSync(articlesPath)) {
  console.error(`❌ 文件不存在: ${articlesPath}`);
  process.exit(1);
}

const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
const tweetIds = articles.map(article => article.tweet_id);
console.log(`📖 读取到 ${tweetIds.length} 个推文ID`);

// Twitter API配置
const RAPIDAPI_KEY = 'ab9b25a33dmsh9bbd3a16233f27dp1d0125jsn3cc5b2112be6';
const API_BASE_URL = 'https://twitter241.p.rapidapi.com/tweet';

// 获取推文详细信息（带重试逻辑）
async function fetchTweetDetails(tweetId, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}?pid=${tweetId}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'twitter241.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      });

      if (response.status === 404) {
        console.log(`推文 ${tweetId} 未找到 (404) - 跳过`);
        return null;
      }

      if (response.status === 429) {
        console.log(`推文 ${tweetId} 触发限流，等待 ${attempt * 5} 秒...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 5000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`尝试 ${attempt}/${retries} 获取推文 ${tweetId} 失败:`, error.message);
      if (attempt === retries) {
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
  return null;
}

// Function to generate a slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50);
}

// Function to extract full article content from article result
function extractFullArticleContent(articleResult) {
  try {
    // First try content_state.blocks (the correct structure)
    if (articleResult?.content_state?.blocks && Array.isArray(articleResult.content_state.blocks)) {
      const textBlocks = articleResult.content_state.blocks
        .filter(block => block.text && block.text.trim())
        .map(block => block.text.trim());
      
      if (textBlocks.length > 0) {
        const fullContent = textBlocks.join('\n\n');
        console.log(`Extracted full article content: ${fullContent.length} characters`);
        return fullContent;
      }
    }
    
    // Fallback to old structure (content.blocks)
    if (articleResult?.content?.blocks && Array.isArray(articleResult.content.blocks)) {
      const textBlocks = articleResult.content.blocks
        .filter(block => block.text && block.text.trim())
        .map(block => block.text.trim());
      
      if (textBlocks.length > 0) {
        const fullContent = textBlocks.join('\n\n');
        console.log(`Extracted full article content (fallback): ${fullContent.length} characters`);
        return fullContent;
      }
    }
    
    // Final fallback to preview text or description
    console.log('No blocks found, using preview text as fallback');
    return articleResult?.preview_text || articleResult?.description || '';
  } catch (error) {
    console.error('Error extracting full article content:', error);
    return articleResult?.preview_text || articleResult?.description || '';
  }
}

// 提取所需字段
function extractTweetData(tweetData, originalTweetId) {
  if (!tweetData || !tweetData.data) {
    console.log(`❌ 推文 ${originalTweetId}: 无效的API响应结构`);
    return null;
  }

  // 从API响应中查找推文数据
  let tweet = null;
  let user = null;
  
  // 遍历timeline指令查找推文
  const instructions = tweetData.data.threaded_conversation_with_injections_v2?.instructions || [];
  
  for (const instruction of instructions) {
    if (instruction.type === 'TimelineAddEntries') {
      const entries = instruction.entries || [];
      
      for (const entry of entries) {
        if (entry.content?.entryType === 'TimelineTimelineItem') {
          const itemContent = entry.content.itemContent;
          
          if (itemContent?.tweet_results?.result) {
            const tweetResult = itemContent.tweet_results.result;
            
            // 检查是否是我们要找的推文
            if (tweetResult.rest_id === originalTweetId || 
                tweetResult.legacy?.id_str === originalTweetId) {
              tweet = tweetResult;
              user = tweetResult.core?.user_results?.result;
              break;
            }
          }
        }
      }
      
      if (tweet) break;
    }
  }
  
  if (!tweet) {
    console.log(`❌ 推文 ${originalTweetId}: 在API响应中未找到推文数据`);
    return null;
  }
  
  const legacy = tweet.legacy || {};
  const userLegacy = user?.legacy || {};
  
  // Check for article data in the tweet
  const articleResult = tweet.article_results?.result || tweet.article?.article_results?.result;
  
  const tweetText = legacy.full_text || legacy.text || 'No content available';
  const authorHandle = userLegacy.screen_name || 'unknown';
  
  // 提取文章URL（如果存在）
  let articleUrl = null;
  
  // 从URL实体中查找文章链接
  const urls = legacy.entities?.urls || [];
  for (const url of urls) {
    if (url.expanded_url && (
      url.expanded_url.includes('medium.com') ||
      url.expanded_url.includes('substack.com') ||
      url.expanded_url.includes('mirror.xyz') ||
      url.expanded_url.includes('blog.') ||
      url.expanded_url.includes('/blog/') ||
      url.expanded_url.includes('article') ||
      url.expanded_url.includes('post')
    )) {
      articleUrl = url.expanded_url;
      break;
    }
  }

  // Base tweet data
  const baseData = {
    id: null, // 将在数据库中自动生成
    author_name: userLegacy.name || null,
    author_handle: authorHandle,
    author_avatar: userLegacy.profile_image_url_https || null,
    article_published_at: legacy.created_at ? new Date(legacy.created_at).toISOString() : null,
    article_url: articleUrl || `https://x.com/${authorHandle}/status/${originalTweetId}`,
    updated_at: new Date().toISOString(),
    tweet_id: originalTweetId,
    tweet_text: tweetText,
    tweet_published_at: legacy.created_at ? new Date(legacy.created_at).toISOString() : null,
    tweet_views: tweet.views?.count || 0,
    tweet_replies: legacy.reply_count || 0,
    tweet_retweets: legacy.retweet_count || 0,
    tweet_likes: legacy.favorite_count || 0,
    tweet_bookmarks: legacy.bookmark_count || 0
  };
  
  // If article data exists, add article fields
  if (articleResult) {
    console.log(`Article data found for tweet ${originalTweetId}:`, {
      title: articleResult.title,
      hasPreviewText: !!articleResult.preview_text,
      hasDescription: !!articleResult.description,
      hasCoverMedia: !!articleResult.cover_media
    });
    
    const title = articleResult.title || tweetText.substring(0, 100) || 'Untitled Article';
    const slug = generateSlug(title) + '-' + Math.random().toString(36).substring(2, 8);
    const excerpt = articleResult.preview_text || articleResult.description || tweetText.substring(0, 200);
    const featuredImageUrl = articleResult.cover_media?.media_info?.original_img_url;
    const fullArticleContent = extractFullArticleContent(articleResult);
    
    // Determine category based on username
    const categories = ['Technology', 'Business', 'Politics', 'Entertainment', 'Sports'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    return {
      ...baseData,
      title: title,
      slug: slug,
      image: featuredImageUrl || legacy.entities?.media?.[0]?.media_url_https,
      category: category,
      article_preview_text: excerpt,
      full_article_content: fullArticleContent || excerpt || title
    };
  } else {
    // No article data, return basic tweet data
    console.log(`No article data found for tweet ${originalTweetId}`);
    return {
      ...baseData,
      title: tweetText.substring(0, 100) || 'Tweet',
      slug: generateSlug(tweetText.substring(0, 50)) + '-' + Math.random().toString(36).substring(2, 8),
      image: legacy.entities?.media?.[0]?.media_url_https || null,
      category: 'General',
      article_preview_text: tweetText.substring(0, 200),
      full_article_content: tweetText
    };
  }
}

// 主函数
async function fetchAllTweetDetails() {
  console.log('🚀 开始获取推文详细信息...');
  
  const detailedTweets = [];
  const failedTweets = [];
  const batchSize = 10; // 每批处理10条推文
  let totalProcessed = 0;
  
  for (let i = 0; i < tweetIds.length; i += batchSize) {
    const batch = tweetIds.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(tweetIds.length / batchSize);
    
    console.log(`\n=== 处理批次 ${batchNumber}/${totalBatches} (推文 ${i + 1}-${Math.min(i + batchSize, tweetIds.length)}) ===`);
    
    // 在批次内顺序处理推文
    for (let j = 0; j < batch.length; j++) {
      const tweetId = batch[j];
      const globalIndex = i + j;
      
      console.log(`处理进度: ${globalIndex + 1}/${tweetIds.length} - ${tweetId}`);
      
      try {
        const tweetData = await fetchTweetDetails(tweetId);
        
        if (tweetData) {
          const extractedData = extractTweetData(tweetData, tweetId);
          if (extractedData) {
            detailedTweets.push(extractedData);
            console.log(`✅ ${tweetId}: 成功获取详细信息`);
          } else {
            failedTweets.push({ tweet_id: tweetId, reason: '数据提取失败' });
            console.log(`❌ ${tweetId}: 数据提取失败`);
          }
        } else {
          failedTweets.push({ tweet_id: tweetId, reason: 'API请求失败' });
          console.log(`❌ ${tweetId}: API请求失败`);
        }
      } catch (error) {
        console.error(`❌ 处理推文 ${tweetId} 时出错:`, error.message);
        failedTweets.push({ tweet_id: tweetId, reason: error.message });
      }
      
      totalProcessed++;
      
      // 在单个推文之间添加短暂延迟
      if (j < batch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`批次 ${batchNumber} 完成: 总成功 ${detailedTweets.length}, 总失败 ${failedTweets.length}`);
    
    // 批次间延迟
    if (i + batchSize < tweetIds.length) {
      console.log('等待2秒后处理下一批次...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // 保存结果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const detailedFile = `tweet-details-${timestamp}.json`;
  const failedFile = `failed-tweets-${timestamp}.json`;
  
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts', detailedFile),
    JSON.stringify(detailedTweets, null, 2)
  );
  
  if (failedTweets.length > 0) {
    fs.writeFileSync(
      path.join(process.cwd(), 'scripts', failedFile),
      JSON.stringify(failedTweets, null, 2)
    );
  }
  
  console.log('\n=== 获取完成 ===');
  console.log(`总处理推文数: ${totalProcessed}`);
  console.log(`✅ 成功获取: ${detailedTweets.length} 条`);
  console.log(`❌ 失败: ${failedTweets.length} 条`);
  console.log(`成功率: ${((detailedTweets.length / totalProcessed) * 100).toFixed(1)}%`);
  console.log(`📁 详细数据保存到: ${detailedFile}`);
  if (failedTweets.length > 0) {
    console.log(`📁 失败列表保存到: ${failedFile}`);
  }
}

// 执行获取
fetchAllTweetDetails().catch(console.error);
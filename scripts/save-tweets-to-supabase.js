import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载 .env.local 文件
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  console.error('请确保设置了 SUPABASE_URL 和 SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 批量插入数据到 Supabase
async function insertBatchToSupabase(tweets, batchNumber, totalBatches) {
  try {
    console.log(`📤 正在插入批次 ${batchNumber}/${totalBatches} (${tweets.length} 条记录)`);
    
    const { data, error } = await supabase
      .from('articles')
      .insert(tweets);
    
    if (error) {
      console.error(`❌ 批次 ${batchNumber} 插入失败:`, error);
      return { success: false, error };
    }
    
    console.log(`✅ 批次 ${batchNumber} 插入成功: ${tweets.length} 条记录`);
    return { success: true, data };
  } catch (error) {
    console.error(`❌ 批次 ${batchNumber} 插入异常:`, error);
    return { success: false, error };
  }
}

// 主函数：保存推文数据到 Supabase
async function saveTweetsToSupabase() {
  try {
    // 查找最新的推文详细信息文件
    const files = fs.readdirSync(__dirname);
    const tweetDetailFiles = files.filter(file => file.startsWith('tweet-details-') && file.endsWith('.json'));
    
    if (tweetDetailFiles.length === 0) {
      console.error('❌ 没有找到推文详细信息文件');
      console.error('请先运行 fetch-tweet-details.js 脚本');
      return;
    }
    
    // 使用最新的文件
    const latestFile = tweetDetailFiles.sort().pop();
    const filePath = path.join(__dirname, latestFile);
    
    console.log(`📖 读取文件: ${latestFile}`);
    
    // 读取推文数据
    const tweetsData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`📊 找到 ${tweetsData.length} 条推文数据`);
    
    if (tweetsData.length === 0) {
      console.log('❌ 没有推文数据需要保存');
      return;
    }
    
    // 准备数据格式以匹配 Supabase 表结构
    const formattedTweets = tweetsData.map(tweet => {
      const formattedTweet = {
        tweet_id: tweet.tweet_id,
        tweet_text: tweet.tweet_text || tweet.full_text || '',
        tweet_published_at: tweet.tweet_published_at || tweet.created_at,
        tweet_views: tweet.tweet_views || 0,
        tweet_replies: tweet.tweet_replies || tweet.reply_count || 0,
        tweet_retweets: tweet.tweet_retweets || tweet.retweet_count || 0,
        tweet_likes: tweet.tweet_likes || tweet.favorite_count || 0,
        tweet_bookmarks: tweet.tweet_bookmarks || 0,
        author_name: tweet.author_name || '',
        author_handle: tweet.author_handle || '',
        author_avatar: tweet.author_avatar || '',
        updated_at: new Date().toISOString()
      };
      
      // 如果有文章数据，添加文章相关字段
      if (tweet.title) {
        formattedTweet.title = tweet.title;
        formattedTweet.slug = tweet.slug;
        formattedTweet.image = tweet.image;
        formattedTweet.article_url = tweet.article_url;
        formattedTweet.article_published_at = tweet.article_published_at;
        formattedTweet.category = tweet.category;
        formattedTweet.article_preview_text = tweet.article_preview_text;
        formattedTweet.full_article_content = tweet.full_article_content;
      }
      
      return formattedTweet;
    });
    
    console.log(`🔄 准备保存 ${formattedTweets.length} 条格式化数据到 Supabase`);
    
    // 分批处理数据
    const batchSize = 50;
    const totalBatches = Math.ceil(formattedTweets.length / batchSize);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < formattedTweets.length; i += batchSize) {
      const batch = formattedTweets.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      const result = await insertBatchToSupabase(batch, batchNumber, totalBatches);
      
      if (result.success) {
        successCount += batch.length;
      } else {
        errorCount += batch.length;
        errors.push({
          batch: batchNumber,
          error: result.error
        });
      }
      
      // 批次间延迟
      if (i + batchSize < formattedTweets.length) {
        console.log('⏳ 等待1秒后处理下一批次...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n=== 保存完成 ===');
    console.log(`📊 总处理记录数: ${formattedTweets.length}`);
    console.log(`✅ 成功保存: ${successCount} 条`);
    console.log(`❌ 失败: ${errorCount} 条`);
    console.log(`成功率: ${((successCount / formattedTweets.length) * 100).toFixed(1)}%`);
    
    if (errors.length > 0) {
      console.log('\n❌ 错误详情:');
      errors.forEach(err => {
        console.log(`批次 ${err.batch}:`, err.error.message || err.error);
      });
    }
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

// 执行保存
saveTweetsToSupabase().catch(console.error);
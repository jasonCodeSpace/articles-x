import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deduplicateArticles() {
  console.log('开始去重文章...');
  
  try {
    // 查找所有重复的tweet_id
    const { data: allArticles, error: allArticlesError } = await supabase
      .from('articles')
      .select('tweet_id');
    
    if (allArticlesError) {
      throw allArticlesError;
    }
    
    // 统计每个tweet_id的出现次数
    const counts = {};
    allArticles.forEach(article => {
      counts[article.tweet_id] = (counts[article.tweet_id] || 0) + 1;
    });
    
    // 返回重复的tweet_id
    const duplicates = Object.keys(counts).filter(tweetId => counts[tweetId] > 1);
    const duplicatesError = null;
    
    if (duplicatesError) {
      throw duplicatesError;
    }
    
    console.log(`发现 ${duplicates.length} 个重复的tweet_id`);
    
    let totalDeleted = 0;
    
    // 对每个重复的tweet_id进行处理
    for (const tweetId of duplicates) {
      console.log(`处理tweet_id: ${tweetId}`);
      
      // 获取该tweet_id的所有记录，按updated_at降序排列
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('id, updated_at')
        .eq('tweet_id', tweetId)
        .order('updated_at', { ascending: false });
      
      if (articlesError) {
        console.error(`获取tweet_id ${tweetId} 的记录时出错:`, articlesError);
        continue;
      }
      
      if (articles.length <= 1) {
        console.log(`tweet_id ${tweetId} 只有 ${articles.length} 条记录，跳过`);
        continue;
      }
      
      // 保留最新的记录（第一个），删除其他的
      const toDelete = articles.slice(1);
      const deleteIds = toDelete.map(article => article.id);
      
      console.log(`tweet_id ${tweetId}: 保留最新记录 ${articles[0].id}，删除 ${deleteIds.length} 条旧记录`);
      
      // 删除重复记录
      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .in('id', deleteIds);
      
      if (deleteError) {
        console.error(`删除tweet_id ${tweetId} 的重复记录时出错:`, deleteError);
        continue;
      }
      
      totalDeleted += deleteIds.length;
      console.log(`成功删除 ${deleteIds.length} 条重复记录`);
      
      // 添加小延迟避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n去重完成！总共删除了 ${totalDeleted} 条重复记录`);
    
    // 验证去重结果
    const { data: remainingDuplicates, error: verifyError } = await supabase
      .rpc('count_duplicates');
    
    if (!verifyError && remainingDuplicates === 0) {
      console.log('验证成功：没有剩余的重复记录');
    } else {
      // 如果RPC函数不存在，使用普通查询验证
      const { data: verification } = await supabase
        .from('articles')
        .select('tweet_id')
        .then(result => {
          if (result.error) return { data: null };
          
          const counts = {};
          result.data.forEach(article => {
            counts[article.tweet_id] = (counts[article.tweet_id] || 0) + 1;
          });
          
          const remaining = Object.keys(counts).filter(tweetId => counts[tweetId] > 1);
          return { data: remaining.length };
        });
      
      if (verification.data === 0) {
        console.log('验证成功：没有剩余的重复记录');
      } else {
        console.log(`警告：仍有 ${verification.data} 个重复的tweet_id`);
      }
    }
    
  } catch (error) {
    console.error('去重过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行去重脚本
deduplicateArticles();
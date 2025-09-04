import { config } from 'dotenv';
import { createServiceClient } from '../lib/supabase/service';
import { generateSlugFromTitle, generateShortId } from '../lib/url-utils';

// 加载环境变量
config({ path: '.env.local' });

const supabase = createServiceClient();

async function fixAllBrokenSlugs() {
  console.log('开始修复所有错误的slug...');
  
  try {
    // 查找所有可能有问题的文章：slug中没有连字符且标题部分长度超过10
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, slug, tweet_id')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching articles:', error);
      return;
    }
    
    if (!articles || articles.length === 0) {
      console.log('没有找到需要修复的文章');
      return;
    }
    
    console.log(`找到 ${articles.length} 篇可能需要修复的文章`);
    
    let fixedCount = 0;
    
    for (const article of articles) {
      // 检查slug的标题部分是否没有连字符
      const slugParts = article.slug.split('--');
      if (slugParts.length !== 2) {
        console.log(`跳过文章 ${article.id}: slug格式不正确`);
        continue;
      }
      
      const titlePart = slugParts[0];
      const idPart = slugParts[1];
      
      // 如果标题部分没有连字符且长度超过10，说明可能有问题
      if (!titlePart.includes('-') && titlePart.length > 10) {
        // 生成正确的slug
        const titleSlug = generateSlugFromTitle(article.title);
        const shortId = generateShortId(article.tweet_id);
        const newSlug = `${titleSlug}--${shortId}`;
        
        if (newSlug !== article.slug) {
          console.log(`\n修复文章: ${article.title}`);
          console.log(`  旧slug: ${article.slug}`);
          console.log(`  新slug: ${newSlug}`);
          
          // 更新数据库
          const { error: updateError } = await supabase
            .from('articles')
            .update({ slug: newSlug })
            .eq('id', article.id);
          
          if (updateError) {
            console.error(`  更新失败:`, updateError);
          } else {
            console.log(`  ✅ 更新成功`);
            fixedCount++;
          }
        }
      }
    }
    
    console.log(`\n修复完成！共修复了 ${fixedCount} 篇文章的slug`);
    
  } catch (error) {
    console.error('修复过程中出错:', error);
  }
}

fixAllBrokenSlugs();
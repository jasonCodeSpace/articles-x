import { config } from 'dotenv';
import { createServiceClient } from '../lib/supabase/service';
import { generateSlugFromTitle, generateShortId } from '../lib/url-utils';

config({ path: '.env.local' });

const supabase = createServiceClient();

async function fixRemainingBrokenSlugs() {
  try {
    console.log('开始修复剩余的错误格式slug...');
    
    // 查找所有可能有问题的slug：标题部分没有连字符且长度超过15的
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, slug, tweet_id')
      .not('slug', 'is', null);
    
    if (error) {
      console.error('获取文章失败:', error);
      return;
    }
    
    let fixedCount = 0;
    
    for (const article of articles) {
      const slugParts = article.slug.split('--');
      if (slugParts.length !== 2) {
        continue;
      }
      
      const titlePart = slugParts[0];
      const idPart = slugParts[1];
      
      // 检查是否是错误格式：标题部分没有连字符且长度超过15
      if (!titlePart.includes('-') && titlePart.length > 15) {
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

fixRemainingBrokenSlugs();
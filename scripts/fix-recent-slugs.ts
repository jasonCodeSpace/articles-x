import { createClient } from '@supabase/supabase-js';
import { generateSlugFromTitle, generateShortId } from '../lib/url-utils';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRecentSlugs() {
  console.log('开始修复最近20个文章的slug...');
  
  try {
    // 获取最近20个文章
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, slug, tweet_id')
      .order('article_published_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('获取文章失败:', error);
      return;
    }

    if (!articles || articles.length === 0) {
      console.log('没有找到文章');
      return;
    }

    console.log(`找到 ${articles.length} 篇文章`);

    let updatedCount = 0;
    
    for (const article of articles) {
      if (!article.title) {
        console.log(`跳过文章 ${article.id}: 没有标题`);
        continue;
      }

      // 从title和tweet_id生成新的slug
      const titleSlug = generateSlugFromTitle(article.title);
      const shortId = generateShortId(article.tweet_id);
      const newSlug = `${titleSlug}--${shortId}`;
      
      // 检查是否需要更新
      if (newSlug !== article.slug) {
        console.log(`更新文章 ${article.id}:`);
        console.log(`  标题: ${article.title}`);
        console.log(`  旧slug: ${article.slug}`);
        console.log(`  新slug: ${newSlug}`);
        
        // 更新数据库中的slug
        const { error: updateError } = await supabase
          .from('articles')
          .update({ slug: newSlug })
          .eq('id', article.id);

        if (updateError) {
          console.error(`更新文章 ${article.id} 失败:`, updateError);
        } else {
          updatedCount++;
          console.log(`✅ 成功更新文章 ${article.id}`);
        }
      } else {
        console.log(`文章 ${article.id} 的slug已经正确，无需更新`);
      }
    }

    console.log(`\n修复完成！共更新了 ${updatedCount} 篇文章的slug`);
    
  } catch (error) {
    console.error('修复slug时发生错误:', error);
  }
}

fixRecentSlugs();
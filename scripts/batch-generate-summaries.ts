import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 首先加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY not found in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Article {
  id: string;
  title: string;
  full_article_content: string;
  summary_english?: string;
  summary_chinese?: string;
}

/**
 * 批量生成文章摘要并上传到数据库
 * 每10篇文章为一批处理
 */
async function batchGenerateSummaries() {
  try {
    // 动态导入gemini模块
    const { generateArticleSummary } = await import('../lib/gemini');
    
    console.log('开始获取最新的300篇文章...');
    
    // 获取最新的300篇还没有摘要的文章
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, full_article_content')
      .is('summary_english', null)
      .order('tweet_published_at', { ascending: false })
      .limit(300);

    if (error) {
      throw new Error(`获取文章失败: ${error.message}`);
    }

    if (!articles || articles.length === 0) {
      console.log('没有找到需要生成摘要的文章');
      return;
    }

    console.log(`找到 ${articles.length} 篇需要生成摘要的文章`);

    // 按每10篇分批处理
    const batchSize = 10;
    const totalBatches = Math.ceil(articles.length / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const startIndex = i * batchSize;
      const endIndex = Math.min(startIndex + batchSize, articles.length);
      const batch = articles.slice(startIndex, endIndex);
      
      console.log(`\n处理第 ${i + 1}/${totalBatches} 批 (${startIndex + 1}-${endIndex} 篇文章)`);
      
      // 处理当前批次的文章
      const summaries = [];
      
      for (const article of batch) {
        try {
          console.log(`正在生成文章摘要: ${article.title.substring(0, 50)}...`);
          
          if (!article.full_article_content || article.full_article_content.trim().length === 0) {
            console.log(`跳过无内容的文章: ${article.id}`);
            continue;
          }
          
          const summary = await generateArticleSummary(article.full_article_content, article.title);
          
          summaries.push({
            id: article.id,
            summary_english: summary.english,
            summary_chinese: summary.chinese,
            summary_generated_at: new Date().toISOString()
          });
          
          console.log(`✓ 成功生成摘要: ${article.id}`);
          
          // 添加延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`生成摘要失败 ${article.id}:`, error);
          continue;
        }
      }
      
      // 批量上传当前批次的摘要到数据库
      if (summaries.length > 0) {
        console.log(`\n上传 ${summaries.length} 个摘要到数据库...`);
        
        for (const summary of summaries) {
          const { error: updateError } = await supabase
            .from('articles')
            .update({
              summary_english: summary.summary_english,
              summary_chinese: summary.summary_chinese,
              summary_generated_at: summary.summary_generated_at
            })
            .eq('id', summary.id);
            
          if (updateError) {
            console.error(`更新文章 ${summary.id} 失败:`, updateError);
          } else {
            console.log(`✓ 成功更新文章: ${summary.id}`);
          }
        }
        
        console.log(`✓ 第 ${i + 1} 批处理完成`);
      } else {
        console.log(`第 ${i + 1} 批没有成功生成的摘要`);
      }
      
      // 批次间添加延迟
      if (i < totalBatches - 1) {
        console.log('等待5秒后处理下一批...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('\n✓ 所有批次处理完成!');
    
  } catch (error) {
    console.error('批量生成摘要失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  batchGenerateSummaries()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

export { batchGenerateSummaries };
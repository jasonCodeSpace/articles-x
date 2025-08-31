import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { generateArticleAnalysis } from '../lib/gemini';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Article {
  id: string;
  title: string;
  language: string;
  full_article_content?: string;
  article_preview_text?: string;
}

async function translateArticleWithRetry(article: Article, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 调用 Gemini API (尝试 ${attempt}/${maxRetries})...`);
      
      const analysis = await generateArticleAnalysis(
        article.full_article_content || article.article_preview_text || article.title,
        article.title
      );
      
      return analysis;
    } catch (error) {
      console.error(`Error generating article analysis:`, error);
      
      if (attempt < maxRetries) {
        const delay = attempt * 10000; // 递增延迟：10s, 20s, 30s
        console.log(`⚠️ API 调用失败，重试 ${attempt}/${maxRetries}...`);
        console.log(`⏳ 等待 ${delay / 1000} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error('Failed to generate article analysis');
      }
    }
  }
}

async function translateNonEnglishArticles() {
  console.log('🌍 开始翻译非英文文章...');
  
  // 获取需要翻译的非英文文章
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, language, full_article_content, article_preview_text')
    .neq('language', 'en')
    .or('title_english.is.null,article_preview_text_english.is.null,full_article_content_english.is.null')
    .order('updated_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ 获取文章失败:', error);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log('✅ 没有需要翻译的文章');
    return;
  }

  console.log(`📚 找到 ${articles.length} 篇需要翻译的文章`);

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n🔄 处理文章 ${i + 1}/${articles.length}: ${article.title}`);
    console.log(`📝 语言: ${article.language}`);

    try {
      const analysis = await translateArticleWithRetry(article);
      
      // 更新数据库
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          title_english: analysis.title_english,
          article_preview_text_english: analysis.article_preview_text_english,
          full_article_content_english: analysis.full_article_content_english,
          category: analysis.category || 'General',
          language: article.language
        })
        .eq('id', article.id);

      if (updateError) {
        console.error(`❌ 更新文章失败: ${article.title}`, updateError);
      } else {
        console.log(`✅ 成功翻译并更新: ${article.title}`);
      }

      // 在文章之间添加延迟，避免API限制
      if (i < articles.length - 1) {
        console.log('⏳ 等待15秒后处理下一篇文章...');
        await new Promise(resolve => setTimeout(resolve, 15000));
      }

    } catch (error) {
      console.error(`❌ 处理文章失败: ${article.title}`, error);
      // 继续处理下一篇文章
      continue;
    }
  }

  console.log('\n🎉 翻译任务完成!');
}

// 运行翻译
translateNonEnglishArticles().catch(console.error);
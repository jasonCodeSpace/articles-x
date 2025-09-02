import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { generateArticleAnalysis } from '@/lib/gemini';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  // Verify cron secret for security when called via HTTP
  const authHeader = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');
  
  if ((!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== CRON_SECRET) && 
      querySecret !== CRON_SECRET) {
    console.error('Unauthorized access attempt to generate-summaries API');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const supabase = createServiceClient();
    
    // 先获取最近发布的100条推文对应的文章
    const { data: recentArticles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, full_article_content, summary_chinese, summary_english, summary_generated_at, tweet_published_at, category, language, title_english, article_preview_text_english, full_article_content_english, tweet_text, article_preview_text')
      .not('full_article_content', 'is', null)
      .not('tweet_published_at', 'is', null)
      .order('tweet_published_at', { ascending: false })
      .limit(100);
    
    if (fetchError) {
      console.error('Error fetching recent articles:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch recent articles' },
        { status: 500 }
      );
    }
    
    // 从最近100条文章中筛选出没有中文摘要、没有分类或没有英文翻译的文章
    const articles = recentArticles?.filter(article => 
      !article.summary_chinese || !article.category || (!article.title_english && article.language !== 'en')
    ) || [];
    
    if (!articles || articles.length === 0) {
      return NextResponse.json(
        { message: 'No articles found that need summaries' },
        { status: 200 }
      );
    }
    
    console.log(`Processing ${articles.length} articles for summary generation`);
    
    const results = [];
    const errors = [];
    
    // 逐个处理文章以避免API限制
    for (const article of articles) {
      try {
        if (!article.full_article_content) {
          console.warn(`Article ${article.id} has no content, skipping`);
          continue;
        }
        
        console.log(`Generating summary for article: ${article.title}`);
        
        const analysis = await generateArticleAnalysis(article.full_article_content, article.title);
        
        // 准备更新数据
        const updateData: {
          summary_chinese: string;
          summary_english: string;
          summary_generated_at: string;
          category: string;
          language: string;
          title_english?: string;
          article_preview_text_english?: string;
          full_article_content_english?: string;
        } = {
          summary_chinese: analysis.summary.chinese,
          summary_english: analysis.summary.english,
          summary_generated_at: new Date().toISOString(),
          category: analysis.category,
          language: analysis.language
        };

        // 如果有英文翻译，添加翻译字段
        if (analysis.english_translation) {
          updateData.title_english = analysis.english_translation.title;
          updateData.article_preview_text_english = analysis.english_translation.article_preview_text;
          updateData.full_article_content_english = analysis.english_translation.full_article_content;
        } else if (analysis.language === 'en') {
          // 如果文章本身就是英文，直接复制原内容
          updateData.title_english = article.title;
          updateData.article_preview_text_english = article.article_preview_text || '';
          updateData.full_article_content_english = article.full_article_content;
        }

        // 更新数据库
        const { error: updateError } = await supabase
          .from('articles')
          .update(updateData)
          .eq('id', article.id);
        
        if (updateError) {
          console.error(`Error updating article ${article.id}:`, updateError);
          errors.push({
            articleId: article.id,
            error: updateError.message
          });
        } else {
          results.push({
            articleId: article.id,
            title: article.title,
            category: analysis.category,
            language: analysis.language,
            summaryGenerated: true
          });
          console.log(`Successfully processed article: ${article.title}`);
        }
        
        // 添加延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing article ${article.id}:`, error);
        errors.push({
          articleId: article.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      message: `Processed ${results.length} articles successfully`,
      results,
      errors,
      totalProcessed: results.length,
      totalErrors: errors.length
    });
    
  } catch (error) {
    console.error('Error in generate-summaries API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 支持GET请求用于手动触发
export async function GET(request: NextRequest) {
  return POST(request);
}
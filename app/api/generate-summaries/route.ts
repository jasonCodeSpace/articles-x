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
    
    // 先获取最近发布的200条推文对应的文章
    const { data: recentArticles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, full_article_content, summary_chinese, summary_english, summary_generated_at, tweet_published_at, category, language')
      .not('full_article_content', 'is', null)
      .not('tweet_published_at', 'is', null)
      .order('tweet_published_at', { ascending: false })
      .limit(200);
    
    if (fetchError) {
      console.error('Error fetching recent articles:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch recent articles' },
        { status: 500 }
      );
    }
    
    // 从最近200条文章中筛选出需要重新生成总结的文章，但限制处理数量
    const problematicArticles = recentArticles?.filter(article => 
      !article.summary_generated_at || // 没有生成过总结
      !article.summary_english || 
      !article.summary_chinese ||
      article.summary_chinese.includes('意大利语段落') ||
      article.summary_chinese.includes('Chinese Summary') ||
      article.summary_chinese.includes('中文总结段落') ||
      article.summary_english.includes('English paragraph') ||
      article.summary_english.includes('English Summary') ||
      article.summary_english === '' ||
      !article.category || 
      !article.language
    ) || [];
    
    // 限制每次只处理10篇文章，避免超时
    const articles = problematicArticles.slice(0, 10);
    
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
          language: string;
          category?: string;
        } = {
          summary_chinese: analysis.summary.chinese,
          summary_english: analysis.summary.english,
          summary_generated_at: new Date().toISOString(),
          language: analysis.language
        };
        
        // 添加分类信息（如果存在）
        if (analysis.category) {
          updateData.category = analysis.category;
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
            language: analysis.language,
            summaryGenerated: true
          });
          console.log(`Successfully processed article: ${article.title}`);
        }
        
        // 添加延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
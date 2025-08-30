import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { generateArticleAnalysis } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    // 先获取最近发布的100条推文对应的文章
    const { data: recentArticles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, full_article_content, summary_chinese, summary_english, summary_generated_at, tweet_published_at')
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
    
    // 从最近100条文章中筛选出没有中文摘要的文章
    const articles = recentArticles?.filter(article => 
      !article.summary_chinese
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
        
        // 更新数据库
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            summary_chinese: analysis.summary.chinese,
            summary_english: analysis.summary.english,
            summary_generated_at: new Date().toISOString(),
            category: analysis.category
          })
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
export async function GET() {
  return POST(new NextRequest('http://localhost/api/generate-summaries', { method: 'POST' }));
}
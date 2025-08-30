import { NextRequest, NextResponse } from 'next/server';
import { generateArticleSummary } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { articleId, content, title } = await request.json();

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 如果没有提供content和title，从数据库获取
    let articleContent = content;
    let articleTitle = title;

    if (!articleContent || !articleTitle) {
      const { data: article, error: fetchError } = await supabase
        .from('articles')
        .select('title, content')
        .eq('id', articleId)
        .single();

      if (fetchError || !article) {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }

      articleContent = article.content || '';
      articleTitle = article.title;
    }

    if (!articleContent) {
      return NextResponse.json(
        { error: 'Article content is empty' },
        { status: 400 }
      );
    }

    // 生成总结
    const summary = await generateArticleSummary(articleContent, articleTitle);

    // 更新数据库中的总结字段
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        summary_chinese: summary.chinese,
        summary_english: summary.english,
        summary_generated_at: new Date().toISOString()
      })
      .eq('id', articleId);

    if (updateError) {
      console.error('Error updating article summary:', updateError);
      return NextResponse.json(
        { error: 'Failed to save summary to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      summary,
      articleId
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

// 批量生成总结的端点
export async function PUT(request: NextRequest) {
  try {
    const { limit = 10 } = await request.json();
    const supabase = await createClient();

    // 获取没有总结的文章
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, content')
      .is('summary_chinese', null)
      .not('content', 'is', null)
      .limit(limit);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles need summary generation',
        processed: 0
      });
    }

    const results = [];
    let processed = 0;

    for (const article of articles) {
      try {
        const summary = await generateArticleSummary(article.content, article.title);
        
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            summary_chinese: summary.chinese,
            summary_english: summary.english,
            summary_generated_at: new Date().toISOString()
          })
          .eq('id', article.id);

        if (!updateError) {
          results.push({ id: article.id, success: true });
          processed++;
        } else {
          results.push({ id: article.id, success: false, error: updateError.message });
        }

        // 添加延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate summary for article ${article.id}:`, error);
        results.push({ id: article.id, success: false, error: (error as Error).message });
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      total: articles.length,
      results
    });

  } catch (error) {
    console.error('Error in batch summary generation:', error);
    return NextResponse.json(
      { error: 'Failed to process batch summary generation' },
      { status: 500 }
    );
  }
}

// 获取文章总结的端点
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: article, error } = await supabase
      .from('articles')
      .select('id, title, summary_chinese, summary_english, summary_generated_at')
      .eq('id', articleId)
      .single();

    if (error || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        summary: {
          chinese: article.summary_chinese,
          english: article.summary_english
        },
        summaryGeneratedAt: article.summary_generated_at
      }
    });

  } catch (error) {
    console.error('Error fetching article summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article summary' },
      { status: 500 }
    );
  }
}
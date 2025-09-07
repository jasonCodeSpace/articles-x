import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
// Email functionality removed

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

interface Article {
  id: string;
  title: string;
  author_name: string;
  category: string;
  summary_english: string;
  tweet_views: number;
}

interface CategorySummary {
  [category: string]: {
    count: number;
    articles: string[];
    summary: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Starting daily summary generation...');

    // Get current date and 24 hours ago
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const todayDate = now.toISOString().split('T')[0];

    // Check if summary already exists for today
    const { data: existingSummary } = await supabase
      .from('daily_summary')
      .select('id')
      .eq('date', todayDate)
      .single();

    if (existingSummary) {
      console.log('Daily summary already exists for today');
      return NextResponse.json({ 
        message: 'Daily summary already exists for today',
        date: todayDate 
      });
    }

    // Get articles from the past 24 hours
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, author_name, category, summary_english, tweet_views')
      .gte('article_published_at', yesterday.toISOString())
      .lt('article_published_at', now.toISOString())
      .order('tweet_views', { ascending: false });

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    if (!articles || articles.length === 0) {
      console.log('No articles found in the past 24 hours');
      return NextResponse.json({ 
        message: 'No articles found in the past 24 hours',
        date: todayDate 
      });
    }

    console.log(`Found ${articles.length} articles from the past 24 hours`);

    // Get the top article by view count
    const topArticle = articles[0];

    // Group articles by category
    const categorySummaries: CategorySummary = {};
    
    articles.forEach((article: Article) => {
      const category = article.category || 'Uncategorized';
      if (!categorySummaries[category]) {
        categorySummaries[category] = {
          count: 0,
          articles: [],
          summary: ''
        };
      }
      categorySummaries[category].count++;
      categorySummaries[category].articles.push(`${article.title} by ${article.author_name}`);
    });

    // Generate AI summary using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
请为以下文章数据生成一个专业的每日总结报告。这些是过去24小时内发布的文章：

总文章数：${articles.length}
最受欢迎文章：${topArticle.title} (观看量：${topArticle.tweet_views})

按分类统计：
${Object.entries(categorySummaries).map(([category, data]) => 
  `${category}: ${data.count}篇文章\n- ${data.articles.slice(0, 3).join('\n- ')}`
).join('\n\n')}

请生成一个结构化的总结，包括：
1. 整体概述
2. 各分类亮点
3. 趋势分析
4. 推荐阅读

请用专业但易读的中文撰写，适合在网站trending页面展示。
`;

    console.log('Generating AI summary with Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryContent = response.text();

    console.log('AI summary generated successfully');

    // Insert daily summary into database
    const { data: insertedSummary, error: insertError } = await supabase
      .from('daily_summary')
      .insert({
        date: todayDate,
        summary_content: summaryContent,
        top_article_title: topArticle.title,
        top_article_id: topArticle.id,
        total_articles_count: articles.length,
        categories_summary: categorySummaries
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting daily summary:', insertError);
      return NextResponse.json({ error: 'Failed to save daily summary' }, { status: 500 });
    }

    console.log('Daily summary saved successfully');

    // Email functionality removed

    return NextResponse.json({
      success: true,
      message: 'Daily summary generated successfully',
      data: {
        id: insertedSummary.id,
        date: todayDate,
        articlesCount: articles.length,
        topArticle: topArticle.title,
        categories: Object.keys(categorySummaries)
      }
    });

  } catch (error) {
    console.error('Error in daily summary generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
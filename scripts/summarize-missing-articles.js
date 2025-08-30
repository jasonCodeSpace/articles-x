import 'dotenv/config';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// 获取最近200篇没有AI总结的文章
async function getArticlesNeedingSummary() {
  console.log('🔍 查询需要总结的文章...');
  
  const { data, error } = await supabase
    .from('articles')
    .select('id, tweet_id, title, full_article_content, summary_chinese, summary_english, tweet_published_at')
    .not('tweet_published_at', 'is', null)
    .order('tweet_published_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('❌ 查询文章失败:', error);
    return [];
  }

  // 过滤出需要总结的文章
  const articlesNeedingSummary = data.filter(article => {
    // 检查是否缺少总结
    const needsSummary = !article.summary_chinese || !article.summary_english;
    
    // 检查文章内容长度
    const contentLength = article.full_article_content ? article.full_article_content.length : 0;
    const hasEnoughContent = contentLength >= 150;
    
    return needsSummary && hasEnoughContent;
  });

  console.log(`📊 找到 ${articlesNeedingSummary.length} 篇需要总结的文章`);
  return articlesNeedingSummary;
}

// 使用Gemini分析文章
async function analyzeArticle(article) {
  const prompt = `请为以下文章生成结构化的中文和英文摘要。请严格按照以下JSON格式返回：

{
  "summary_chinese": "中文摘要（100-200字）",
  "summary_english": "English summary (100-200 words)"
}

文章信息：
标题：${article.title}
内容：${article.full_article_content}

请确保返回的是有效的JSON格式，不要包含其他文字说明。`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const summaryText = response.text();
    
    // Parse JSON response
    let summaryData;
    try {
      // Clean the response text to extract JSON
      const cleanedText = summaryText.replace(/```json\n?|```\n?/g, '').trim();
      summaryData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw response:', summaryText);
      return null;
    }
    
    return {
      summary_chinese: summaryData.summary_chinese,
      summary_english: summaryData.summary_english
    };
  } catch (error) {
    console.error('❌ Gemini分析失败:', error);
    return null;
  }
}

// 保存分析结果到Supabase
async function saveAnalysisToSupabase(analyses) {
  console.log(`💾 保存 ${analyses.length} 个分析结果到数据库`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const analysis of analyses) {
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          summary_chinese: analysis.summary_chinese,
          summary_english: analysis.summary_english,
          summary_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('tweet_id', analysis.tweet_id);
      
      if (error) {
        console.error(`❌ 保存失败 (${analysis.tweet_id}):`, error);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.error(`❌ 保存异常 (${analysis.tweet_id}):`, err);
      errorCount++;
    }
  }
  
  console.log(`📊 保存结果: 成功 ${successCount}, 失败 ${errorCount}`);
  return { successCount, errorCount };
}

// 主函数
async function main() {
  console.log('🚀 开始处理缺少总结的文章...');
  
  try {
    // 获取需要总结的文章
    const articles = await getArticlesNeedingSummary();
    
    if (articles.length === 0) {
      console.log('✅ 没有需要总结的文章');
      return;
    }
    
    const analyses = [];
    const batchSize = 10;
    let totalSuccessCount = 0;
    let totalErrorCount = 0;
    
    // 逐篇分析文章
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      console.log(`\n=== 处理进度: ${i + 1}/${articles.length} ===`);
      console.log(`🤖 正在分析文章: ${article.title.substring(0, 80)}`);
      
      const analysis = await analyzeArticle(article);
      
      if (analysis) {
        analyses.push({
          tweet_id: article.tweet_id,
          ...analysis
        });
        console.log(`✅ 文章分析完成: ${article.title.substring(0, 80)}`);
        console.log('Chinese:', analysis.summary_chinese?.substring(0, 100) + '...');
        console.log('English:', analysis.summary_english?.substring(0, 100) + '...');
      } else {
        console.log(`❌ 文章分析失败: ${article.title.substring(0, 80)}`);
        totalErrorCount++;
      }
      
      // 每10篇文章保存一次
      if (analyses.length === batchSize || i === articles.length - 1) {
        console.log(`\n💾 保存第 ${Math.ceil((i + 1) / batchSize)} 批分析结果 (${analyses.length} 篇文章)`);
        const { successCount, errorCount } = await saveAnalysisToSupabase(analyses);
        
        totalSuccessCount += successCount;
        totalErrorCount += errorCount;
        
        console.log('✅ 批次保存完成，继续处理下一批文章...');
        analyses.length = 0; // 清空数组
      }
      
      // 等待3秒避免API限制
      if (i < articles.length - 1) {
        console.log('⏳ 等待3秒后处理下一篇文章...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n=== 分析任务完成 ===');
    console.log(`📊 总文章数: ${articles.length}`);
    console.log(`✅ 处理文章数: ${articles.length}`);
    console.log(`💾 成功保存: ${totalSuccessCount}`);
    console.log(`❌ 保存失败: ${totalErrorCount}`);
    
  } catch (error) {
    console.error('❌ 程序执行失败:', error);
  }
}

// 运行主函数
main();
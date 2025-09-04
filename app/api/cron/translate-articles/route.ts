/**
 * CRITICAL: This is the ONLY file that should generate English translations for articles.
 * 
 * This file is responsible for translating the following fields ONLY:
 * - title -> title_english
 * - article_preview_text -> article_preview_text_english  
 * - full_article_content -> full_article_content_english
 * 
 * RULES:
 * 1. These English fields should ONLY be generated through Gemini API translation
 * 2. These fields should ONLY contain English text
 * 3. NO other code should modify these English translation fields
 * 4. This translation should happen ONLY after the original article is created
 * 
 * If you need to modify translation logic, do it HERE and ONLY here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TRANSLATION_PROMPT, parseTranslationResponse } from '@/lib/translation-prompts';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  // Verify cron secret for security when called via HTTP
  const authHeader = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');
  
  if ((!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== CRON_SECRET) && 
      querySecret !== CRON_SECRET) {
    console.error('Unauthorized access attempt to translate-articles API');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const supabase = createServiceClient();
    
    // 直接查询所有需要翻译的文章（英文字段为空的）
    const { data: articlesToTranslate, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, slug, article_preview_text, full_article_content, title_english, article_preview_text_english, full_article_content_english, tweet_published_at')
      .not('full_article_content', 'is', null)
      .or('title_english.is.null,title_english.eq.,article_preview_text_english.is.null,article_preview_text_english.eq.,full_article_content_english.is.null,full_article_content_english.eq.')
      .order('updated_at', { ascending: false })
      .limit(50);
    
    if (fetchError) {
      console.error('Error fetching articles to translate:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch articles to translate' },
        { status: 500 }
      );
    }
    
    // 限制每次只处理20篇文章，避免超时和API限制
    const articles = (articlesToTranslate || []).slice(0, 20);
    
    if (!articles || articles.length === 0) {
      return NextResponse.json(
        { message: 'No articles found that need translation' },
        { status: 200 }
      );
    }
    
    console.log(`Processing ${articles.length} articles for translation`);
    
    const results = [];
    const errors = [];
    
    // 逐个处理文章以避免API限制
    for (const article of articles) {
      try {
        if (!article.full_article_content) {
          console.warn(`Article ${article.id} has no content, skipping`);
          continue;
        }
        
        console.log(`Translating article: ${article.title}`);
        
        // 使用专门的翻译功能而不是 generateArticleAnalysis
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // 使用专门的翻译提示词
        const prompt = TRANSLATION_PROMPT
          .replace('{title}', article.title)
          .replace('{preview}', article.article_preview_text || 'No preview available')
          .replace('{content}', article.full_article_content);
        
        const result = await model.generateContent(prompt);
        const response = await result.response.text();
        
        // 使用专门的解析函数
        const translation = parseTranslationResponse(response);
        
        // 清理无效翻译值的函数
        const cleanTranslation = (translatedText: string, fallbackText: string): string => {
          // 如果翻译为空字符串，直接返回空字符串（表示需要跳过此字段）
          if (!translatedText || translatedText.trim().length === 0) {
            return '';
          }
          
          const invalidValues = [
            'not provided', 'not available', 'not applicable', 'not stated', 
            'not translated', 'not given', 'not found', 'unavailable', 'missing',
            'empty', 'blank', 'no content', 'no translation', 'original text',
            'same as original', 'n/a', 'na', 'none', 'null', 'undefined'
          ];
          
          // 检查是否包含无效值
          if (invalidValues.some(invalid => translatedText.toLowerCase().includes(invalid))) {
            console.log(`Quality control: Filtering out invalid translation placeholder: "${translatedText.substring(0, 100)}..."`);
            return '';
          }
          
          // 检查翻译是否与原文完全相同（表示翻译失败）
          if (translatedText.trim() === fallbackText.trim()) {
            console.log(`Quality control: Translation identical to original, skipping: "${translatedText.substring(0, 100)}..."`);
            return '';
          }
          
          return translatedText;
        };

        // 准备翻译更新数据
        const updateData: {
          title_english?: string;
          article_preview_text_english?: string;
          full_article_content_english?: string;
          slug?: string;
        } = {};

        // 只更新空白的英文字段
        if (!article.title_english || article.title_english.trim() === '') {
          updateData.title_english = cleanTranslation(translation.title, article.title);
        }
        if (!article.article_preview_text_english || article.article_preview_text_english.trim() === '') {
          updateData.article_preview_text_english = cleanTranslation(translation.article_preview_text, article.article_preview_text || '');
        }
        if (!article.full_article_content_english || article.full_article_content_english.trim() === '') {
          updateData.full_article_content_english = cleanTranslation(translation.full_article_content, article.full_article_content);
        }

        // 注意：slug 一旦生成就不应该再被修改，即使翻译了标题也保持原有的 slug

        // 只有当有字段需要更新时才执行数据库更新
        if (Object.keys(updateData).length > 0) {
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
              fieldsUpdated: Object.keys(updateData),
              translationGenerated: true
            });
            console.log(`Successfully translated article: ${article.title}`);
          }
        } else {
          console.log(`No translation needed for article: ${article.title}`);
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
      totalErrors: errors.length,
      totalArticlesChecked: articles.length
    });
    
  } catch (error) {
    console.error('Error in translate-articles API:', error);
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
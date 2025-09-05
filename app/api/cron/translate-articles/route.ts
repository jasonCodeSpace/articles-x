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
import { getApiUsageStats } from '@/lib/api-usage-tracker';

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
    
    // 获取最新300篇文章
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, article_preview_text, full_article_content, title_english, article_preview_text_english, full_article_content_english, language')
      .not('full_article_content', 'is', null)
      .order('article_published_at', { ascending: false })
      .limit(300);
    
    if (fetchError) {
      console.error('Error fetching articles:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }
    
    if (!articles || articles.length === 0) {
      return NextResponse.json(
        { message: 'No articles found' },
        { status: 200 }
      );
    }
    
    console.log(`Processing ${articles.length} articles for translation`);
    
    // 第一步：对英文文章直接复制内容到英文字段
    const englishArticles = articles.filter(article => article.language === 'en');
    const copyResults = [];
    
    for (const article of englishArticles) {
      try {
        const updateData: {
          title_english?: string;
          article_preview_text_english?: string;
          full_article_content_english?: string;
        } = {};
        
        // 直接复制英文内容
        if (!article.title_english || article.title_english.trim() === '') {
          updateData.title_english = article.title;
        }
        if (!article.article_preview_text_english || article.article_preview_text_english.trim() === '') {
          updateData.article_preview_text_english = article.article_preview_text || '';
        }
        if (!article.full_article_content_english || article.full_article_content_english.trim() === '') {
          updateData.full_article_content_english = article.full_article_content;
        }
        
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('articles')
            .update(updateData)
            .eq('id', article.id);
          
          if (updateError) {
            console.error(`Error copying English content for article ${article.id}:`, updateError);
          } else {
            copyResults.push({
              articleId: article.id,
              title: article.title,
              action: 'copied_english_content'
            });
            console.log(`Copied English content for article: ${article.title}`);
          }
        }
      } catch (error) {
        console.error(`Error processing English article ${article.id}:`, error);
      }
    }
    
    // 第二步：检查翻译错误
    const articlesWithErrors = [];
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    for (const article of articles) {
      const errors = [];
      
      // 检查空值
      if (!article.title_english || article.title_english.trim() === '') {
        errors.push('title_english_empty');
      }
      if (!article.article_preview_text_english || article.article_preview_text_english.trim() === '') {
        errors.push('article_preview_text_english_empty');
      }
      if (!article.full_article_content_english || article.full_article_content_english.trim() === '') {
        errors.push('full_article_content_english_empty');
      }
      
      // 检查是否为英文（使用Gemini API）- 特别注意日语、中文、意大利语、西班牙语等
      if (article.title_english && article.title_english.trim() !== '') {
        try {
          const languageCheckPrompt = `Please identify the language of this text. Pay special attention to Japanese, Chinese, Italian, Spanish and other non-English languages. Respond with only the language code (e.g., 'en' for English, 'zh' for Chinese, 'ja' for Japanese, 'it' for Italian, 'es' for Spanish, etc.):\n\n"${article.title_english}"`;
          const result = await model.generateContent(languageCheckPrompt);
          const detectedLanguage = (await result.response.text()).trim().toLowerCase();
          
          if (detectedLanguage !== 'en' && detectedLanguage !== 'english') {
            errors.push('title_english_not_english');
          }
          
          // 添加延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error checking language for title_english of article ${article.id}:`, error);
        }
      }
      
      if (article.article_preview_text_english && article.article_preview_text_english.trim() !== '') {
        try {
          // 检查前200个字符以节省API调用
          const previewSample = article.article_preview_text_english.substring(0, 200);
          const languageCheckPrompt = `Please identify the language of this text. Pay special attention to Japanese, Chinese, Italian, Spanish and other non-English languages. Respond with only the language code (e.g., 'en' for English, 'zh' for Chinese, 'ja' for Japanese, 'it' for Italian, 'es' for Spanish, etc.):\n\n"${previewSample}"`;
          const result = await model.generateContent(languageCheckPrompt);
          const detectedLanguage = (await result.response.text()).trim().toLowerCase();
          
          if (detectedLanguage !== 'en' && detectedLanguage !== 'english') {
            errors.push('article_preview_text_english_not_english');
          }
          
          // 添加延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error checking language for article_preview_text_english of article ${article.id}:`, error);
        }
      }
      
      if (article.full_article_content_english && article.full_article_content_english.trim() !== '') {
        try {
          // 只检查前200个字符以节省API调用
          const contentSample = article.full_article_content_english.substring(0, 200);
          const languageCheckPrompt = `Please identify the language of this text. Pay special attention to Japanese, Chinese, Italian, Spanish and other non-English languages. Respond with only the language code (e.g., 'en' for English, 'zh' for Chinese, 'ja' for Japanese, 'it' for Italian, 'es' for Spanish, etc.):\n\n"${contentSample}"`;
          const result = await model.generateContent(languageCheckPrompt);
          const detectedLanguage = (await result.response.text()).trim().toLowerCase();
          
          if (detectedLanguage !== 'en' && detectedLanguage !== 'english') {
            errors.push('full_article_content_english_not_english');
          }
          
          // 添加延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error checking language for full_article_content_english of article ${article.id}:`, error);
        }
      }
      
      if (errors.length > 0) {
        articlesWithErrors.push({
          ...article,
          translationErrors: errors
        });
      }
    }
    
    // 第三步：翻译有错误的文章
    const apiStats = getApiUsageStats();
    const remainingCalls = apiStats.gemini.remaining;
    
    // 限制翻译文章数量以避免API限制
    const TRANSLATION_BATCH_SIZE = Math.min(20, remainingCalls - (articles.length * 2)); // 减去语言检测使用的API调用
    
    const articlesToTranslate = articlesWithErrors.slice(0, TRANSLATION_BATCH_SIZE);
    const translationResults = [];
    const translationErrors = [];
    
    // 逐个翻译有错误的文章
    for (const article of articlesToTranslate) {
      try {
        if (!article.full_article_content) {
          console.warn(`Article ${article.id} has no content, skipping`);
          continue;
        }
        
        console.log(`Translating article: ${article.title} (Errors: ${article.translationErrors.join(', ')})`);
        
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
        } = {};

        // 根据错误类型更新相应字段
        if (article.translationErrors.includes('title_english_empty') || 
            article.translationErrors.includes('title_english_not_english')) {
          updateData.title_english = cleanTranslation(translation.title, article.title);
        }
        if (article.translationErrors.includes('article_preview_text_english_empty') || 
            article.translationErrors.includes('article_preview_text_english_not_english')) {
          updateData.article_preview_text_english = cleanTranslation(translation.article_preview_text, article.article_preview_text || '');
        }
        if (article.translationErrors.includes('full_article_content_english_empty') || 
            article.translationErrors.includes('full_article_content_english_not_english')) {
          updateData.full_article_content_english = cleanTranslation(translation.full_article_content, article.full_article_content);
        }

        // 只有当有字段需要更新时才执行数据库更新
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('articles')
            .update(updateData)
            .eq('id', article.id);
          
          if (updateError) {
            console.error(`Error updating article ${article.id}:`, updateError);
            translationErrors.push({
              articleId: article.id,
              error: updateError.message
            });
          } else {
            translationResults.push({
              articleId: article.id,
              title: article.title,
              fieldsUpdated: Object.keys(updateData),
              errorsFixed: article.translationErrors,
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
        translationErrors.push({
          articleId: article.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const finalApiStats = getApiUsageStats();
    return NextResponse.json({
      message: `Translation process completed`,
      summary: {
        totalArticlesChecked: articles.length,
        englishArticlesCopied: copyResults.length,
        articlesWithErrors: articlesWithErrors.length,
        articlesTranslated: translationResults.length,
        translationErrors: translationErrors.length
      },
      copyResults,
      articlesWithErrors: articlesWithErrors.map(a => ({
        id: a.id,
        title: a.title,
        errors: a.translationErrors
      })),
      translationResults,
      translationErrors,
      geminiUsage: {
        used: finalApiStats.gemini.count - apiStats.gemini.count,
        remaining: finalApiStats.gemini.remaining,
        percentage: finalApiStats.gemini.percentage
      }
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
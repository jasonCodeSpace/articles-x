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
    
    // 获取最新30篇文章（减少处理量以避免超时）
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, article_preview_text, full_article_content, title_english, article_preview_text_english, full_article_content_english, language')
      .not('full_article_content', 'is', null)
      .order('article_published_at', { ascending: false })
      .limit(30);
    
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // 简单英文检测函数
    const isLikelyEnglish = (text: string): boolean => {
      // 检查是否包含明显的非英文字符
      const nonEnglishChars = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u0400-\u04ff\u0590-\u05ff\u0600-\u06ff]/;
      if (nonEnglishChars.test(text)) {
        return false;
      }
      
      // 检查常见英文单词
      const commonEnglishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'a', 'an'];
      const words = text.toLowerCase().split(/\s+/);
      const englishWordCount = words.filter(word => commonEnglishWords.includes(word.replace(/[^a-z]/g, ''))).length;
      
      // 如果英文常用词占比超过20%，认为是英文
      return englishWordCount / words.length > 0.2;
    };
    
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
      
      // 检查是否为英文（先用简单检测，英文直接跳过）
      if (article.title_english && article.title_english.trim() !== '') {
        if (!isLikelyEnglish(article.title_english)) {
          // 只对明显不是英文的内容使用 API 检测
          try {
            const languageCheckPrompt = `Please identify the language of this text. Pay special attention to Japanese, Chinese, Italian, Spanish and other non-English languages. Respond with only the language code (e.g., 'en' for English, 'zh' for Chinese, 'ja' for Japanese, 'it' for Italian, 'es' for Spanish, etc.):\n\n"${article.title_english}"`;
            const result = await model.generateContent(languageCheckPrompt);
            const detectedLanguage = (await result.response.text()).trim().toLowerCase();
            
            if (detectedLanguage !== 'en' && detectedLanguage !== 'english') {
              errors.push('title_english_not_english');
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.error(`Error checking language for title_english of article ${article.id}:`, error);
          }
        }
        // 如果是英文，直接跳过，不添加错误
      }
      
      if (article.article_preview_text_english && article.article_preview_text_english.trim() !== '') {
        const previewSample = article.article_preview_text_english.substring(0, 200);
        if (!isLikelyEnglish(previewSample)) {
          try {
            const languageCheckPrompt = `Please identify the language of this text. Pay special attention to Japanese, Chinese, Italian, Spanish and other non-English languages. Respond with only the language code (e.g., 'en' for English, 'zh' for Chinese, 'ja' for Japanese, 'it' for Italian, 'es' for Spanish, etc.):\n\n"${previewSample}"`;
            const result = await model.generateContent(languageCheckPrompt);
            const detectedLanguage = (await result.response.text()).trim().toLowerCase();
            
            if (detectedLanguage !== 'en' && detectedLanguage !== 'english') {
              errors.push('article_preview_text_english_not_english');
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.error(`Error checking language for article_preview_text_english of article ${article.id}:`, error);
          }
        }
      }
      
      if (article.full_article_content_english && article.full_article_content_english.trim() !== '') {
        const contentSample = article.full_article_content_english.substring(0, 200);
        if (!isLikelyEnglish(contentSample)) {
          try {
            const languageCheckPrompt = `Please identify the language of this text. Pay special attention to Japanese, Chinese, Italian, Spanish and other non-English languages. Respond with only the language code (e.g., 'en' for English, 'zh' for Chinese, 'ja' for Japanese, 'it' for Italian, 'es' for Spanish, etc.):\n\n"${contentSample}"`;
            const result = await model.generateContent(languageCheckPrompt);
            const detectedLanguage = (await result.response.text()).trim().toLowerCase();
            
            if (detectedLanguage !== 'en' && detectedLanguage !== 'english') {
              errors.push('full_article_content_english_not_english');
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.error(`Error checking language for full_article_content_english of article ${article.id}:`, error);
          }
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
    const batchUpdates = []; // 存储批量更新的数据
    const BATCH_SIZE = 5; // 每5篇文章批量更新一次
    
    // 逐个翻译有错误的文章
    for (let i = 0; i < articlesToTranslate.length; i++) {
      const article = articlesToTranslate[i];
      try {
        if (!article.full_article_content) {
          console.warn(`Article ${article.id} has no content, skipping`);
          continue;
        }
        
        // 检查三个英文字段是否都是英文，如果都是英文则跳过翻译
        const titleIsEnglish = article.title_english && isLikelyEnglish(article.title_english);
        const previewIsEnglish = article.article_preview_text_english && isLikelyEnglish(article.article_preview_text_english);
        const contentIsEnglish = article.full_article_content_english && isLikelyEnglish(article.full_article_content_english.substring(0, 200));
        
        if (titleIsEnglish && previewIsEnglish && contentIsEnglish) {
          console.log(`Skipping translation for article ${article.id}: All English fields are already in English`);
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

        // 只有当有字段需要更新时才添加到批量更新队列
        if (Object.keys(updateData).length > 0) {
          batchUpdates.push({
            id: article.id,
            updateData,
            article: {
              id: article.id,
              title: article.title,
              translationErrors: article.translationErrors
            }
          });
          console.log(`Prepared translation for article: ${article.title}`);
        } else {
          console.log(`No translation needed for article: ${article.title}`);
        }
        
        // 每处理5篇文章或到达最后一篇时，执行批量更新
        if (batchUpdates.length >= BATCH_SIZE || i === articlesToTranslate.length - 1) {
          if (batchUpdates.length > 0) {
            console.log(`Executing batch update for ${batchUpdates.length} articles...`);
            
            // 执行批量更新
            for (const batch of batchUpdates) {
              try {
                const { error: updateError } = await supabase
                  .from('articles')
                  .update(batch.updateData)
                  .eq('id', batch.id);
                
                if (updateError) {
                  // 检查是否是重复键约束错误（文章已存在）
                  if (updateError.code === '23505') {
                    console.log(`Article ${batch.id} already has translation data, skipping`);
                    translationResults.push({
                      articleId: batch.id,
                      title: batch.article.title,
                      fieldsUpdated: Object.keys(batch.updateData),
                      errorsFixed: batch.article.translationErrors,
                      translationGenerated: false,
                      skipped: 'duplicate_data'
                    });
                  } else {
                    console.error(`Error updating article ${batch.id}:`, updateError);
                    translationErrors.push({
                      articleId: batch.id,
                      error: updateError.message
                    });
                  }
                } else {
                  translationResults.push({
                    articleId: batch.id,
                    title: batch.article.title,
                    fieldsUpdated: Object.keys(batch.updateData),
                    errorsFixed: batch.article.translationErrors,
                    translationGenerated: true
                  });
                }
              } catch (batchError) {
                console.error(`Batch update error for article ${batch.id}:`, batchError);
                translationErrors.push({
                  articleId: batch.id,
                  error: batchError instanceof Error ? batchError.message : 'Batch update failed'
                });
              }
            }
            
            console.log(`Batch update completed for ${batchUpdates.length} articles`);
            batchUpdates.length = 0; // 清空批量更新队列
          }
        }
        
      } catch (error) {
        console.error(`Error processing article ${article.id}:`, error);
        translationErrors.push({
          articleId: article.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // 处理剩余的批量更新（如果有的话）
    if (batchUpdates.length > 0) {
      console.log(`Processing final batch of ${batchUpdates.length} articles...`);
      for (const batch of batchUpdates) {
        try {
          const { error: updateError } = await supabase
            .from('articles')
            .update(batch.updateData)
            .eq('id', batch.id);
          
          if (updateError) {
            // 检查是否是重复键约束错误（文章已存在）
            if (updateError.code === '23505') {
              console.log(`Article ${batch.id} already has translation data, skipping`);
              translationResults.push({
                articleId: batch.id,
                title: batch.article.title,
                fieldsUpdated: Object.keys(batch.updateData),
                errorsFixed: batch.article.translationErrors,
                translationGenerated: false,
                skipped: 'duplicate_data'
              });
            } else {
              console.error(`Error updating article ${batch.id}:`, updateError);
              translationErrors.push({
                articleId: batch.id,
                error: updateError.message
              });
            }
          } else {
            translationResults.push({
              articleId: batch.id,
              title: batch.article.title,
              fieldsUpdated: Object.keys(batch.updateData),
              errorsFixed: batch.article.translationErrors,
              translationGenerated: true
            });
          }
        } catch (batchError) {
          console.error(`Final batch update error for article ${batch.id}:`, batchError);
          translationErrors.push({
            articleId: batch.id,
            error: batchError instanceof Error ? batchError.message : 'Final batch update failed'
          });
        }
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
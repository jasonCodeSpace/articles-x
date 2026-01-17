import OpenAI from 'openai';
import { checkApiLimit, recordApiCall } from '@/lib/api-usage-tracker';

let client: OpenAI | null = null;

function initialize(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY environment variable is required');
  }

  if (!client) {
    client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey,
    });
  }

  return client;
}

export interface ArticleSummary {
  chinese: string;
  english: string;
}

export interface ArticleAnalysis {
  summary: ArticleSummary;
  language: string;
  category?: string;
  title_english?: string; // New field
}

/**
 * 使用 DeepSeek 生成文章总结和分类
 */
export async function generateArticleAnalysis(
  content: string,
  title: string
): Promise<ArticleAnalysis> {
  try {
    // 检查 API 每日调用限制
    const apiLimitCheck = checkApiLimit('deepseek');
    if (!apiLimitCheck.allowed) {
      throw new Error(`Daily DeepSeek API limit exceeded: ${apiLimitCheck.message}`);
    }

    // 记录 API 调用
    const apiCallResult = recordApiCall('deepseek');
    if (!apiCallResult.success) {
      throw new Error('Daily DeepSeek API limit exceeded during call recording');
    }

    const openai = initialize();

    const prompt = `CRITICAL: You MUST follow this EXACT output format. Any deviation will cause system failure.

TASK: Analyze this article and provide the response in the EXACT format specified below.

You must:
1. Detect the primary language of the article.
2. Translate the title to English (if not already English).
3. Produce an ULTRA-CONCISE, read-aloud friendly summary in Simplified Chinese and English.
4. Categorize the article.

LANGUAGE DETECTION:
Use ISO 639-1 language codes (en, zh, es, etc.).

TITLE TRANSLATION:
- Translate the original title to English.
- If the title is already in English, return it exactly as is.
- Field: TITLE_ENGLISH

SUMMARIES:
- summary_chinese: MUST be in Simplified Chinese (简体中文). Even if the article is English/Spanish.
- summary_english: MUST be in English. Even if the article is Chinese/Spanish. Or else it is a failure.

ROLE:
TTS-ready summarizer. Output EXACTLY two sections: first Chinese (2-3 paragraphs), then English (2-3 paragraphs).
NO headings, labels, markers, asterisks, or format indicators of ANY kind within the summary text.

TASK:
Read ARTICLE. Write a comprehensive, natural, read-aloud description.
Target ~300 words for EACH language section. Maximize information density.

OUTPUT FORMAT (FOLLOW EXACTLY):
LANGUAGE: [detected language code]
TITLE_ENGLISH: [The title translated to English]

[Chinese paragraph 1]

[Chinese paragraph 2]

[Chinese paragraph 3 if needed]

[English paragraph 1]

[English paragraph 2]

[English paragraph 3 if needed]

CATEGORY: [Select up to 3 categories from: Hardware, Gaming, Health, Environment, Personal Story, Culture, Philosophy, History, Education, Design, Marketing, AI, Crypto, Tech, Data, Startups, Business, Markets, Product, Security, Policy, Science, Media]

Article Title: ${title}

Article Content:
${content.substring(0, 8000)}`;

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const text = completion.choices[0]?.message?.content || '';

    // Parse Language
    const languageMatch = text.match(/LANGUAGE:\s*([^\n]+)/i);
    const language = languageMatch ? languageMatch[1].trim() : 'en';

    // Parse Title English
    const titleMatch = text.match(/TITLE_ENGLISH:\s*([^\n]+)/i);
    const titleEnglish = titleMatch ? titleMatch[1].trim() : title;

    // Parse Category
    const categoryMatch = text.match(/CATEGORY:\s*([^\n]+)/i);
    const category = categoryMatch ? categoryMatch[1].trim() : undefined;

    // Parse Summaries
    // Remove headers to get the body
    let cleanText = text
      .replace(/LANGUAGE:\s*[^\n]+\n?/i, '')
      .replace(/TITLE_ENGLISH:\s*[^\n]+\n?/i, '')
      .replace(/CATEGORY:\s*[^\n]+$/i, '') // Category is usually at the end
      .trim();
    
    // Split by CATEGORY if it wasn't removed correctly (in case it wasn't at the very end)
    cleanText = cleanText.split(/CATEGORY:/i)[0].trim();

    cleanText = cleanText
      .replace(/\*\*/g, '')
      .replace(/中文概要:/gi, '')
      .replace(/Chinese Summary:/gi, '')
      .replace(/English Summary:/gi, '')
      .replace(/英文总结:/gi, '')
      .trim();

    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim());

    let summary: ArticleSummary;
    
    // Heuristic to split Chinese and English parts
    // We expect Chinese first, then English as per instructions.
    // But we verify with regex.
    
    const hasChinese = (s: string) => /[\u4e00-\u9fff]/.test(s);
    
    let chineseParts: string[] = [];
    let englishParts: string[] = [];

    for (const p of paragraphs) {
        if (hasChinese(p)) {
            chineseParts.push(p);
        } else {
            englishParts.push(p);
        }
    }

    // Fallback if strict separation failed (e.g. English text mixed in Chinese paragraph or vice versa)
    // If we have distinct blocks, good. If not, try splitting by half.
    if (chineseParts.length === 0 && englishParts.length === 0) {
         // Should not happen if paragraphs exist
         summary = { chinese: cleanText, english: cleanText }; // Fail safe
    } else if (chineseParts.length === 0) {
        // All English?
        const mid = Math.floor(englishParts.length / 2);
        summary = { 
            chinese: "无法生成中文摘要", 
            english: englishParts.join('\n\n') 
        };
    } else if (englishParts.length === 0) {
        // All Chinese?
        summary = { 
            chinese: chineseParts.join('\n\n'), 
            english: "Could not generate English summary." 
        };
    } else {
        summary = {
            chinese: chineseParts.join('\n\n'),
            english: englishParts.join('\n\n')
        };
    }

    summary.english = summary.english.replace(/\*/g, '');
    summary.chinese = summary.chinese.replace(/\*/g, '');

    return {
      summary,
      language,
      category,
      title_english: titleEnglish
    };
  } catch (error) {
    console.error('Error generating article analysis:', error);
    throw new Error('Failed to generate article analysis');
  }
}

/**
 * 使用 DeepSeek 生成文章总结
 */
export async function generateArticleSummary(
  content: string,
  title: string
): Promise<ArticleSummary> {
  const analysis = await generateArticleAnalysis(content, title);
  return analysis.summary;
}

/**
 * 批量生成文章总结
 */
export async function batchGenerateSummaries(
  articles: Array<{ id: string; title: string; content?: string }>
): Promise<Array<{ id: string; summary: ArticleSummary }>> {
  const results = [];

  for (const article of articles) {
    if (!article.content) {
      console.warn(`Article ${article.id} has no content, skipping summary generation`);
      continue;
    }

    try {
      const summary = await generateArticleSummary(article.content, article.title);
      results.push({ id: article.id, summary });

      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to generate summary for article ${article.id}:`, error);
    }
  }

  return results;
}

/**
 * 生成文章分类
 */
export async function generateCategories(
  title: string,
  content: string
): Promise<string[]> {
  try {
    const apiLimitCheck = checkApiLimit('deepseek');
    if (!apiLimitCheck.allowed) {
      throw new Error(`Daily DeepSeek API limit exceeded: ${apiLimitCheck.message}`);
    }

    const apiCallResult = recordApiCall('deepseek');
    if (!apiCallResult.success) {
      throw new Error('Daily DeepSeek API limit exceeded during call recording');
    }

    const openai = initialize();

    const allowedCategories = [
      'Hardware', 'Gaming', 'Health', 'Environment', 'Personal Story', 'Culture',
      'Philosophy', 'History', 'Education', 'Design', 'Marketing', 'AI', 'Crypto',
      'Tech', 'Data', 'Startups', 'Business', 'Markets', 'Product', 'Security',
      'Policy', 'Science', 'Media'
    ];

    const prompt = `TASK: Analyze the article and assign 1-3 most relevant categories.

ALLOWED CATEGORIES (choose 1-3 most relevant):
${allowedCategories.join(', ')}

OUTPUT FORMAT:
CATEGORIES: [List categories separated by commas, maximum 3]

ARTICLE:
Title: ${title}
Content: ${content.substring(0, 4000)}

Analyze and select 1-3 most relevant categories:`;

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const text = completion.choices[0]?.message?.content || '';

    const categoryMatch = text.match(/CATEGORIES:\s*([^\n]+)/i);
    if (categoryMatch) {
      const categoriesText = categoryMatch[1].trim();
      const categories = categoriesText
        .split(',')
        .map(cat => cat.trim())
        .filter(cat => allowedCategories.includes(cat))
        .slice(0, 3);

      if (categories.length > 0) {
        return categories;
      }
    }

    const foundCategories = [];
    for (const category of allowedCategories) {
      if (text.toLowerCase().includes(category.toLowerCase()) && foundCategories.length < 3) {
        foundCategories.push(category);
      }
    }

    return foundCategories.length > 0 ? foundCategories : [];
  } catch (error) {
    console.error('Error generating categories:', error);
    throw new Error('Failed to generate categories');
  }
}

/**
 * 检查 API 连接状态
 */
export async function testConnection(): Promise<boolean> {
  try {
    const apiLimitCheck = checkApiLimit('deepseek');
    if (!apiLimitCheck.allowed) {
      console.error(`Daily DeepSeek API limit exceeded: ${apiLimitCheck.message}`);
      return false;
    }

    const apiCallResult = recordApiCall('deepseek');
    if (!apiCallResult.success) {
      console.error('Daily DeepSeek API limit exceeded during call recording');
      return false;
    }

    const openai = initialize();
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: 'Hello, this is a test.' }
      ],
      max_tokens: 10,
    });

    return !!completion.choices[0]?.message?.content;
  } catch (error) {
    console.error('DeepSeek API connection test failed:', error);
    return false;
  }
}

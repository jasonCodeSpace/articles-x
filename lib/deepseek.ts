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
  skipSummary?: boolean; // True if article is too short
}

/**
 * 检测文本是否主要包含英文（不包含中文字符）
 */
function isPureEnglish(text: string): boolean {
  // 检查是否包含中文字符
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  // 检查是否包含英文字母
  const hasEnglish = /[a-zA-Z]/.test(text);
  // 如果有英文且没有中文，认为是纯英文
  return hasEnglish && !hasChinese;
}

/**
 * 检测文本是否主要为英文（允许少量中文）
 */
function isMostlyEnglish(text: string): boolean {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  // 如果中文字符少于总字符的 20%，认为是英文
  return totalChars > 0 && (chineseChars / totalChars) < 0.2;
}

/**
 * Count words in content (handles both English and Chinese)
 */
function countWords(text: string): number {
  // Count Chinese characters
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  // Count English words (split by whitespace, filter empty)
  const englishWords = text.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(w => w.length > 0).length
  return chineseChars + englishWords
}

/**
 * Get summary length instructions based on word count
 */
function getSummaryLengthInstructions(wordCount: number): { targetLength: string; shouldSkip: boolean } {
  if (wordCount < 100) {
    return { targetLength: '', shouldSkip: true }
  } else if (wordCount <= 1500) {
    return { targetLength: '100-200 words', shouldSkip: false }
  } else {
    return { targetLength: '250-500 words', shouldSkip: false }
  }
}

/**
 * 使用 DeepSeek 生成文章总结和分类
 */
export async function generateArticleAnalysis(
  content: string,
  title: string
): Promise<ArticleAnalysis> {
  try {
    // Check word count and determine summary requirements
    const wordCount = countWords(content)
    const { targetLength, shouldSkip } = getSummaryLengthInstructions(wordCount)

    // 检测标题是否已经是英文
    // 如果是纯英文或主要英文，直接使用原标题作为 title_english
    const titleIsEnglish = isPureEnglish(title) || isMostlyEnglish(title)

    // If article is too short (<100 words), skip summary generation
    if (shouldSkip) {
      console.log(`Article "${title}" has only ${wordCount} words, skipping summary generation`)
      return {
        summary: { chinese: '', english: '' },
        language: 'en',
        category: undefined,
        title_english: title,
        skipSummary: true
      }
    }

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

    // 根据标题是否需要翻译，动态构建 prompt
    const titleInstruction = titleIsEnglish
      ? `TITLE_ENGLISH: ${title} (already in English, no translation needed)`
      : `TITLE_ENGLISH: [Translate the original title to pure English - NO Chinese characters allowed]`;

    const prompt = `CRITICAL: You MUST follow this EXACT output format. Any deviation will cause system failure.

TASK: Analyze this article and provide the response in the EXACT format specified below.

You must:
1. Detect the primary language of the article.
2. Produce a STRUCTURED, well-organized summary in Simplified Chinese and English.
3. Categorize the article.

${titleIsEnglish ? 'NOTE: Title is already in English.' : 'CRITICAL: Translate the title to pure English. NO Chinese characters in the translated title!'}

LANGUAGE DETECTION:
Use ISO 639-1 language codes (en, zh, es, etc.).

SUMMARIES:
- summary_chinese: MUST be in Simplified Chinese (简体中文). Even if the article is English/Spanish.
- summary_english: MUST be in English. Even if the article is Chinese/Spanish. Or else it is a failure.

ROLE:
Expert content summarizer. Create structured, informative summaries that help readers quickly understand:
- The main topic and thesis of the article
- Key insights, data points, or arguments
- Important conclusions or takeaways

SUMMARY LENGTH REQUIREMENT:
Each summary (Chinese and English) should be ${targetLength} total.
The article has ${wordCount} words.

SUMMARY STRUCTURE:
- Start with a concise overview of the main topic (1-2 sentences)
- Present key points and insights in a logical order
- End with the main conclusion or takeaway
- NO headings, labels, markers, asterisks, or format indicators
- Write in natural, flowing paragraphs (2-3 paragraphs per language)

OUTPUT FORMAT (FOLLOW EXACTLY):
LANGUAGE: [detected language code]
${titleInstruction}

[Chinese paragraph 1 - main topic overview]

[Chinese paragraph 2 - key insights and points]

[Chinese paragraph 3 if needed - conclusions]

[English paragraph 1 - main topic overview]

[English paragraph 2 - key insights and points]

[English paragraph 3 if needed - conclusions]

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
    let titleEnglish: string;
    if (titleIsEnglish) {
      // Title is already English, use original
      titleEnglish = title;
    } else {
      // Try to parse from AI response
      const titleMatch = text.match(/TITLE_ENGLISH:\s*([^\n]+)/i);
      titleEnglish = titleMatch ? titleMatch[1].trim() : title;
      // 如果解析出的标题包含中文，回退到原标题
      if (/[\u4e00-\u9fff]/.test(titleEnglish)) {
        console.warn(`Parsed title contains Chinese, falling back to original: ${titleEnglish}`);
        titleEnglish = title;
      }
    }

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
    
    const chineseParts: string[] = [];
    const englishParts: string[] = [];

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

/**
 * Low-level DeepSeek API call
 */
export async function callDeepSeek(prompt: string, maxTokens = 2000): Promise<string> {
  const apiLimitCheck = checkApiLimit('deepseek');
  if (!apiLimitCheck.allowed) {
    throw new Error(`Daily DeepSeek API limit exceeded: ${apiLimitCheck.message}`);
  }

  const apiCallResult = recordApiCall('deepseek');
  if (!apiCallResult.success) {
    throw new Error('Daily DeepSeek API limit exceeded during call recording');
  }

  const openai = initialize();
  const completion = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: maxTokens,
  });

  return completion.choices[0]?.message?.content || '';
}

/**
 * Generate English summary + title translation (if needed)
 * Single language output: ALL ENGLISH
 * NOTE: Category is no longer generated - trending is based on full-text search
 */
export async function generateEnglishAnalysis(
  content: string,
  title: string,
  needsTitleTranslation: boolean
): Promise<{
  summary_english: string
  title_english: string | null
}> {
  const prompt = needsTitleTranslation
    ? `Analyze this article and respond in English only.

TITLE: ${title}

CONTENT:
${content.substring(0, 8000)}

Respond in this exact format:
TITLE_ENGLISH: [English translation of the title]
SUMMARY: [2-3 sentence summary in English]`
    : `Analyze this article and respond in English only.

TITLE: ${title}

CONTENT:
${content.substring(0, 8000)}

Respond in this exact format:
SUMMARY: [2-3 sentence summary in English]`

  const response = await callDeepSeek(prompt)
  return parseEnglishResponse(response, title, needsTitleTranslation)
}

/**
 * Translate English summary to Chinese
 * Single language output: ALL CHINESE
 */
export async function translateToChinese(summaryEnglish: string): Promise<string> {
  const prompt = `将以下英文摘要翻译成中文，只输出中文翻译，不要有任何英文：

${summaryEnglish}`

  const response = await callDeepSeek(prompt)
  return response.trim()
}

/**
 * Parse English analysis response
 */
function parseEnglishResponse(
  text: string,
  originalTitle: string,
  needsTitleTranslation: boolean
): { summary_english: string; title_english: string | null } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  let title_english: string | null = null
  let summary_english = ''

  for (const line of lines) {
    if (line.startsWith('TITLE_ENGLISH:')) {
      title_english = line.replace('TITLE_ENGLISH:', '').trim()
    } else if (line.startsWith('SUMMARY:')) {
      summary_english = line.replace('SUMMARY:', '').trim()
    }
  }

  // If no SUMMARY label found, use remaining text
  if (!summary_english) {
    const summaryStart = text.indexOf('SUMMARY:')
    if (summaryStart !== -1) {
      summary_english = text.substring(summaryStart + 8).trim()
    } else {
      // Last resort: use the whole response minus parsed fields
      summary_english = text
    }
  }

  return {
    summary_english,
    title_english: needsTitleTranslation ? title_english : originalTitle
  }
}

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

function initializeGemini(): GenerativeModel | null {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  
  return model;
}

export interface ArticleSummary {
  chinese: string;
  english: string;
}

export interface ArticleAnalysis {
  summary: ArticleSummary;
  category: string;
  language: string;
}

/**
 * 使用Gemini AI生成文章总结和分类
 * @param content 文章内容
 * @param title 文章标题
 * @returns 包含中文和英文总结以及分类的对象
 */
export async function generateArticleAnalysis(
  content: string,
  title: string
): Promise<ArticleAnalysis> {
  try {
    const currentModel = initializeGemini();
    if (!currentModel) {
      throw new Error('Failed to initialize Gemini model');
    }
    
    // 构建提示词，包含摘要生成、分类和语言检测
    const prompt = `TASK: Read the article and perform three tasks:
1. Detect the primary language of the article
2. Categorize the article with ONE category from the provided list
3. Produce an ULTRA-CONCISE, read-aloud friendly summary in English and Chinese

LANGUAGE DETECTION:
Detect the primary language of the article content. Use ISO 639-1 language codes:
- en (English)
- zh (Chinese)
- ja (Japanese)
- ko (Korean)
- es (Spanish)
- fr (French)
- de (German)
- it (Italian)
- pt (Portuguese)
- ru (Russian)
- ar (Arabic)
- hi (Hindi)
- th (Thai)
- vi (Vietnamese)
- tr (Turkish)
- pl (Polish)
- nl (Dutch)
- sv (Swedish)
- da (Danish)
- no (Norwegian)
- fi (Finnish)
- he (Hebrew)
- cs (Czech)
- hu (Hungarian)
- ro (Romanian)
- bg (Bulgarian)
- hr (Croatian)
- sk (Slovak)
- sl (Slovenian)
- et (Estonian)
- lv (Latvian)
- lt (Lithuanian)
- mt (Maltese)
- ga (Irish)
- cy (Welsh)
- is (Icelandic)
- mk (Macedonian)
- sq (Albanian)
- sr (Serbian)
- bs (Bosnian)
- me (Montenegrin)
- uk (Ukrainian)
- be (Belarusian)
- kk (Kazakh)
- ky (Kyrgyz)
- uz (Uzbek)
- tg (Tajik)
- mn (Mongolian)
- ka (Georgian)
- hy (Armenian)
- az (Azerbaijani)
- fa (Persian)
- ur (Urdu)
- bn (Bengali)
- ta (Tamil)
- te (Telugu)
- ml (Malayalam)
- kn (Kannada)
- gu (Gujarati)
- pa (Punjabi)
- or (Odia)
- as (Assamese)
- ne (Nepali)
- si (Sinhala)
- my (Burmese)
- km (Khmer)
- lo (Lao)
- ms (Malay)
- id (Indonesian)
- tl (Filipino)
- sw (Swahili)
- am (Amharic)
- yo (Yoruba)
- ig (Igbo)
- ha (Hausa)
- zu (Zulu)
- xh (Xhosa)
- af (Afrikaans)
If unsure, use 'en' as default.

CATEGORY TASK:
Select ONE category that best fits this article from the following list:
AI, Agents, Models, Lending, DEX, Yield, Perps, Markets, Onchain, Airdrops, L1, L2, Wallets, Infrastructure, Oracles, Policy, Elections, Politics, Social, Media, History, Art, Culture, DAOs, Identity, SocialFi, Startups, VC, Business, GameFi, Esports, Gaming, Hardware, Software, Tech, Health, Science, Security, Education, Economics, Lifestyle, NFTs

SUMMARY GOALS:
- Convey the main thesis, all core points, critical facts (names/dates/numbers), nuances/caveats, and the conclusion.
- Sound natural and informative for speech. Use short, plain sentences. No filler.

SUMMARY OUTPUT FORMAT (in this order):

English
Thesis: ≤ ~18 words (may exceed only if needed for completeness)
Key Points: 3–8 bullets, each ≤ ~12 words; include concrete facts
Nuances/Caveats: 1–4 bullets, ≤ ~12 words each; mark opinions as [opinion]
Conclusion: ≤ ~18 words; state the overall takeaway

中文
主题句：≤ ~18字（必要时可略超，保证完整）
要点：3–8条，每条≤ ~12字；包含姓名、日期、数字等事实
细节/注意：1–4条，每条≤ ~12字；观点用【观点】标注
结论：≤ ~18字；给出总之要义

OUTPUT FORMAT:
LANGUAGE: [detected language code]
CATEGORY: [selected category]

[English summary]

[Chinese summary]

RULES:
- No intro/outro, no repetition, no adjectives unless essential.
- Prefer active voice; keep parallel structure across bullets.
- If the article omits something important, write "not stated".
- If space is tight, do not drop key points—slightly exceed the targets instead.
- Do not use asterisk symbols in the output.
- Choose the most specific and relevant category.
- Detect language based on the actual content, not the title.

Article Title: ${title}

Article Content:
${content.substring(0, 8000)}`; // 限制内容长度避免超出API限制

    const result = await currentModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 解析语言
    const languageMatch = text.match(/LANGUAGE:\s*([^\n]+)/i);
    const language = languageMatch ? languageMatch[1].trim() : 'en'; // 默认语言
    
    // 解析分类
    const categoryMatch = text.match(/CATEGORY:\s*([^\n]+)/i);
    const category = categoryMatch ? categoryMatch[1].trim() : 'Tech'; // 默认分类

    // 解析响应，分离中文和英文总结
    const englishMatch = text.match(/English[\s\S]*?(?=中文|$)/i);
    const chineseMatch = text.match(/中文[\s\S]*$/i);
    
    let summary: ArticleSummary;
    
    if (englishMatch && chineseMatch) {
      summary = {
        english: englishMatch[0].replace(/^English\s*/i, '').trim(),
        chinese: chineseMatch[0].replace(/^中文\s*/i, '').trim()
      };
    } else {
      // 如果解析失败，尝试按分隔符分割
      const parts = text.split(/(?:中文|Chinese)/i);
      if (parts.length >= 2) {
        summary = {
          english: parts[0].replace(/CATEGORY:[^\n]*\n?/i, '').trim(),
          chinese: parts[1].trim()
        };
      } else {
        // 最后的备用方案
        const lines = text.split('\n').filter((line: string) => line.trim() && !line.match(/^CATEGORY:/i));
        const midPoint = Math.floor(lines.length / 2);
        summary = {
          english: lines.slice(0, midPoint).join('\n').trim(),
          chinese: lines.slice(midPoint).join('\n').trim()
        };
      }
    }

    // 移除所有星号符号
    summary.english = summary.english.replace(/\*/g, '');
    summary.chinese = summary.chinese.replace(/\*/g, '');

    return {
      summary,
      category,
      language
    };
  } catch (error) {
    console.error('Error generating article analysis:', error);
    throw new Error('Failed to generate article analysis');
  }
}

/**
 * 使用Gemini AI生成文章总结（保持向后兼容）
 * @param content 文章内容
 * @param title 文章标题
 * @returns 包含中文和英文总结的对象
 */
export async function generateArticleSummary(
  content: string,
  title: string
): Promise<ArticleSummary> {
  try {
    const currentModel = initializeGemini();
    if (!currentModel) {
      throw new Error('Failed to initialize Gemini model');
    }
    
    // 构建提示词，使用用户指定的格式
    const prompt = `TASK: Read the article. Produce an ULTRA-CONCISE, read-aloud friendly summary in English and Chinese. There is no fixed length; prioritize maximum information density while not missing any key point.

GOALS:
- Convey the main thesis, all core points, critical facts (names/dates/numbers), nuances/caveats, and the conclusion.
- Sound natural and informative for speech. Use short, plain sentences. No filler.

OUTPUT FORMAT (in this order):

English
Thesis: ≤ ~18 words (may exceed only if needed for completeness)
Key Points: 3–8 bullets, each ≤ ~12 words; include concrete facts
Nuances/Caveats: 1–4 bullets, ≤ ~12 words each; mark opinions as [opinion]
Conclusion: ≤ ~18 words; state the overall takeaway

中文
主题句：≤ ~18字（必要时可略超，保证完整）
要点：3–8条，每条≤ ~12字；包含姓名、日期、数字等事实
细节/注意：1–4条，每条≤ ~12字；观点用【观点】标注
结论：≤ ~18字；给出总之要义

RULES:
- No intro/outro, no repetition, no adjectives unless essential.
- Prefer active voice; keep parallel structure across bullets.
- If the article omits something important, write "not stated".
- If space is tight, do not drop key points—slightly exceed the targets instead.

Article Title: ${title}

Article Content:
${content.substring(0, 8000)}`; // 限制内容长度避免超出API限制

    const result = await currentModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 解析响应，分离中文和英文总结
    const englishMatch = text.match(/English[\s\S]*?(?=中文|$)/i);
    const chineseMatch = text.match(/中文[\s\S]*$/i);
    
    if (englishMatch && chineseMatch) {
      return {
        english: englishMatch[0].replace(/^English\s*/i, '').trim(),
        chinese: chineseMatch[0].replace(/^中文\s*/i, '').trim()
      };
    } else {
      // 如果解析失败，尝试按分隔符分割
      const parts = text.split(/(?:中文|Chinese)/i);
      if (parts.length >= 2) {
        return {
          english: parts[0].trim(),
          chinese: parts[1].trim()
        };
      } else {
        // 最后的备用方案
        const lines = text.split('\n').filter((line: string) => line.trim());
        const midPoint = Math.floor(lines.length / 2);
        return {
          english: lines.slice(0, midPoint).join('\n').trim(),
          chinese: lines.slice(midPoint).join('\n').trim()
        };
      }
    }
  } catch (error) {
    console.error('Error generating article summary:', error);
    throw new Error('Failed to generate article summary');
  }
}

/**
 * 批量生成文章总结
 * @param articles 文章数组
 * @returns 包含总结的文章数组
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
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to generate summary for article ${article.id}:`, error);
    }
  }
  
  return results;
}

/**
 * 检查Gemini API连接状态
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const currentModel = initializeGemini();
    if (!currentModel) {
      return false;
    }
    const result = await currentModel.generateContent('Hello, this is a test.');
    const response = await result.response;
    return !!response.text();
  } catch (error) {
    console.error('Gemini API connection test failed:', error);
    return false;
  }
}
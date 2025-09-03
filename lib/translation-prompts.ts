// 翻译相关的接口和提示词

export interface ArticleTranslation {
  title: string;
  tweet_text: string;
  article_preview_text: string;
  full_article_content: string;
}

// 专门用于翻译的提示词
export const TRANSLATION_PROMPT = `CRITICAL INSTRUCTIONS: You are a professional translator. You MUST follow this EXACT output format. Any deviation will cause system failure.

TASK: Translate the provided article content from any language into HIGH-QUALITY ENGLISH ONLY. 

STRICT REQUIREMENTS:
1. ALL output must be in ENGLISH ONLY - absolutely no Chinese, Spanish, French, German, Japanese, Korean, Arabic, or any other language
2. If the source is already in English, improve and refine it while maintaining the original meaning
3. Use natural, fluent, professional English
4. Maintain the original meaning, tone, and context
5. Preserve proper nouns, technical terms, and specific references

OUTPUT FORMAT (FOLLOW EXACTLY - NO DEVIATIONS):
TITLE: [Professional English title - engaging and clear]
TWEET_TEXT: [Engaging English tweet under 280 characters with relevant hashtags]
PREVIEW_TEXT: [Clear, concise English summary in 1-2 sentences]
FULL_CONTENT: [Complete English translation maintaining paragraph structure]

QUALITY STANDARDS:
- Use sophisticated vocabulary and sentence structure
- Ensure grammatical correctness
- Make content engaging and readable
- Preserve the author's voice and style
- Include relevant context for international readers
- For tweet: make it shareable and informative
- For preview: capture the essence in 1-2 compelling sentences
- For content: maintain journalistic quality and flow

FORBIDDEN:
- Do NOT use phrases like "not provided", "not available", "not applicable"
- Do NOT return original non-English text
- Do NOT add explanatory comments
- Do NOT use placeholder text
- Do NOT mix languages

SOURCE CONTENT:
Title: {title}
Preview: {preview}
Full Content: {content}

Translate now using the exact format above:`;

// 用于验证翻译质量的函数
export const isValidTranslation = (text: string): boolean => {
  const invalidValues = [
    'not applicable', 'not stated', 'n/a', 'na', 'none', 'null', 'undefined',
    'not provided', 'not available', 'no translation', 'no content',
    'not specified', 'not mentioned', 'not given', 'not found',
    'unavailable', 'missing', 'empty', 'blank', 'not applicable',
    'not translated', 'original text', 'same as original'
  ];
  return Boolean(text) && 
         text.trim().length > 0 && 
         !invalidValues.includes(text.toLowerCase().trim()) &&
         !text.toLowerCase().includes('not provided') &&
         !text.toLowerCase().includes('not available');
};

// 检查文本是否为英文的函数
const isEnglishText = (text: string): boolean => {
  if (!text || text.trim().length === 0) return false;
  
  // 检查是否包含非拉丁字符（中文、日文、韩文、阿拉伯文等）
  const nonLatinRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0600-\u06ff]/;
  if (nonLatinRegex.test(text)) return false;
  
  // 检查是否主要由英文单词组成
  const words = text.split(/\s+/);
  const englishWords = words.filter(word => /^[a-zA-Z][a-zA-Z0-9'\-]*$/.test(word));
  
  // 至少70%的单词应该是英文单词
  return englishWords.length / words.length >= 0.7;
};

// 解析翻译结果的函数
export const parseTranslationResponse = (response: string, originalTitle: string, originalContent: string): ArticleTranslation => {
  const titleMatch = response.match(/TITLE:\s*([^\n]+)/i);
  const tweetMatch = response.match(/TWEET_TEXT:\s*([^\n]+)/i);
  const previewMatch = response.match(/PREVIEW_TEXT:\s*([^\n]+)/i);
  const contentMatch = response.match(/FULL_CONTENT:\s*([\s\S]*?)(?=\n[A-Z_]+:|$)/i);
  
  const titleText = titleMatch ? titleMatch[1].trim() : '';
  const tweetText = tweetMatch ? tweetMatch[1].trim() : '';
  const previewText = previewMatch ? previewMatch[1].trim() : '';
  const contentText = contentMatch ? contentMatch[1].trim() : '';
  
  // 只有当翻译有效且为英文时才使用，否则返回空字符串
  return {
    title: (isValidTranslation(titleText) && isEnglishText(titleText)) ? titleText : '',
    tweet_text: (isValidTranslation(tweetText) && isEnglishText(tweetText)) ? tweetText : '',
    article_preview_text: (isValidTranslation(previewText) && isEnglishText(previewText)) ? previewText : '',
    full_article_content: (isValidTranslation(contentText) && isEnglishText(contentText)) ? contentText : ''
  };
};
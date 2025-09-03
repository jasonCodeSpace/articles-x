// 翻译相关的接口和提示词

export interface ArticleTranslation {
  title: string;
  tweet_text: string;
  article_preview_text: string;
  full_article_content: string;
}

// 专门用于翻译的提示词
export const TRANSLATION_PROMPT = `CRITICAL: You MUST follow this EXACT output format. Any deviation will cause system failure.

TASK: Translate the provided article content into ENGLISH ONLY. You must provide accurate, natural English translations while preserving the original meaning and technical terms. DO NOT return any Chinese, Japanese, Korean, or other non-English text.

You must:
1. Translate the title into natural, engaging ENGLISH
2. Create an appropriate tweet text in ENGLISH (under 280 characters)
3. Translate the preview text into clear, concise ENGLISH
4. Translate the full article content into fluent ENGLISH

OUTPUT FORMAT (FOLLOW EXACTLY):
TITLE: [English translation of the title - natural and engaging]
TWEET_TEXT: [English tweet text - under 280 characters, engaging and informative]
PREVIEW_TEXT: [English translation of preview text - clear and concise]
FULL_CONTENT: [English translation of full article content - fluent and accurate]

TRANSLATION RULES:
- ALL OUTPUT MUST BE IN ENGLISH ONLY - NO EXCEPTIONS
- Maintain original meaning and context
- Use natural, fluent English
- Preserve technical terms and proper nouns
- For tweet text: make it engaging and informative, include relevant hashtags if appropriate
- For preview text: keep it concise but informative
- For full content: maintain paragraph structure and formatting
- If content is already in English, improve clarity and readability while keeping the original meaning
- Do not add explanatory text or commentary
- Do not use placeholder phrases like "not applicable" or "not provided"
- NEVER return Chinese, Japanese, Korean, or any non-English text
- If you cannot translate something, use the closest English equivalent

Article Title: {title}
Article Preview: {preview}
Full Article Content: {content}

Provide the translations in the exact format specified above.`;

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
  
  return {
    title: isValidTranslation(titleText) ? titleText : originalTitle,
    tweet_text: isValidTranslation(tweetText) ? tweetText : `${originalTitle.substring(0, 100)}... Read more about this important topic.`,
    article_preview_text: isValidTranslation(previewText) ? previewText : originalContent.substring(0, 200).replace(/\n/g, ' ').trim() + '...',
    full_article_content: isValidTranslation(contentText) ? contentText : originalContent.substring(0, 8000)
  };
};
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

function initialize(): GenerativeModel | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable is required');
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  
  return model;
}

export interface ArticleSummary {
  chinese: string;
  english: string;
}

export interface ArticleTranslation {
  title: string;
  tweet_text: string;
  article_preview_text: string;
  full_article_content: string;
}

export interface ArticleAnalysis {
  summary: ArticleSummary;
  category: string;
  language: string;
  english_translation?: ArticleTranslation;
}

// 有效分类列表
const VALID_CATEGORIES = [
  'Bitcoin', 'Ethereum', 'Solana', 'Defi', 'Memecoin', 'Trading', 'Mining', 'Wallet', 'Nft', 'Dao',
  'Software', 'Hardware', 'Ai', 'Startup', 'Fintech', 'Biotech', 'Space',
  'Politics', 'Elections', 'Policy', 'International', 'Security', 'Education', 'Culture',
  'Business', 'Economics', 'Markets', 'Investment', 'Banking', 'Energy', 'Real-estate',
  'Gaming', 'Sports', 'Health', 'Travel', 'Food', 'Art', 'Music', 'Fashion',
  'Social-media', 'Journalism', 'Publishing', 'Broadcasting', 'Marketing',
  'Science', 'Research', 'Medicine', 'Climate', 'Environment', 'Physics'
];

export async function generateArticleAnalysis(
  content: string,
  title: string
): Promise<ArticleAnalysis> {
  try {
    const currentModel = initialize();
    if (!currentModel) {
      throw new Error('Failed to initialize Gemini model');
    }
    
    const categoryList = VALID_CATEGORIES.join(', ');
    
    const prompt = `Analyze this article and categorize it.

TASK:
1. Detect language (use codes: en, zh, es, fr, de, it, etc.)
2. Choose ONE specific category from: ${categoryList}
3. Write two clean summary paragraphs without any format labels

CATEGORIZATION RULES:
- Bitcoin/BTC price/analysis/ETF → Bitcoin
- Tesla/cars/automotive/FSD → Hardware
- DeFi/stablecoins/yield farming → Defi
- Gaming/esports/game platforms → Gaming
- Wars/conflicts/international relations → International
- Political campaigns/elections → Politics
- Company earnings/business news → Business
- Stock markets/trading → Markets
- AI/ChatGPT/machine learning → Ai
- Memecoins/DOGE/pump.fun → Memecoin

Choose the MOST SPECIFIC category based on the PRIMARY content topic.

IMPORTANT: Do NOT include any format labels like "中文概要:", "Chinese Paragraph:", "意大利语段落:", "English Summary:" etc. Write clean paragraphs only.

OUTPUT FORMAT:
LANGUAGE: [code]
CATEGORY: [category]

[Write a clean Chinese summary paragraph here]

[Write a clean English summary paragraph here]

Title: ${title}
Content: ${content.substring(0, 6000)}`;

    const result = await currentModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 解析结果
    const languageMatch = text.match(/LANGUAGE:\s*([^\n]+)/i);
    const language = languageMatch ? languageMatch[1].trim() : 'en';
    
    const categoryMatch = text.match(/CATEGORY:\s*([^\n]+)/i);
    const rawCategory = categoryMatch ? categoryMatch[1].trim() : 'Business';
    
    // 验证分类
    const category = VALID_CATEGORIES.find(cat => 
      cat.toLowerCase() === rawCategory.toLowerCase()
    ) || 'Business';

    // 解析总结
    const cleanText = text.replace(/LANGUAGE:\s*[^\n]+\n?/i, '')
                         .replace(/CATEGORY:\s*[^\n]+\n?/i, '')
                         .trim();
    
    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim());
    
    // 清理格式标记的函数
    const cleanSummary = (text: string): string => {
      return text
        .replace(/^(中文概要|Chinese Paragraph|意大利语段落|English Summary|中文总结|英文总结|Summary|概要)[:：]?\s*/i, '')
        .replace(/\*\*(中文概要|Chinese Paragraph|意大利语段落|English Summary|中文总结|英文总结|Summary|概要)[:：]?\*\*\s*/gi, '')
        .replace(/^\*\*[^*]+\*\*[:：]?\s*/gm, '') // 移除任何粗体格式标记
        .trim();
    };
    
    const summary: ArticleSummary = {
      chinese: cleanSummary(paragraphs[0]?.trim() || cleanText),
      english: cleanSummary(paragraphs[1]?.trim() || cleanText)
    };

    return { summary, category, language };
  } catch (error) {
    console.error('Error generating article analysis:', error);
    throw new Error('Failed to generate article analysis');
  }
}

export async function generateArticleSummary(
  content: string,
  title: string
): Promise<ArticleSummary> {
  const analysis = await generateArticleAnalysis(content, title);
  return analysis.summary;
}

export async function testConnection(): Promise<boolean> {
  try {
    const currentModel = initialize();
    if (!currentModel) return false;
    
    const result = await currentModel.generateContent('Test connection');
    const response = await result.response;
    return !!response.text();
  } catch (error) {
    console.error('Gemini API test failed:', error);
    return false;
  }
}

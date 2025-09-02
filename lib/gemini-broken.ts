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

// 定义有效分类列表
const VALID_CATEGORIES = [
  // Crypto & Blockchain
  'Bitcoin', 'Ethereum', 'Solana', 'Defi', 'Memecoin', 'Trading', 'Mining', 'Wallet', 'Nft', 'Dao',
  // Technology & Innovation  
  'Software', 'Hardware', 'Ai', 'Startup', 'Fintech', 'Biotech', 'Space',
  // Politics & Society
  'Politics', 'Elections', 'Policy', 'International', 'Security', 'Education', 'Culture',
  // Business & Economics
  'Business', 'Economics', 'Markets', 'Investment', 'Banking', 'Energy', 'Real-estate',
  // Lifestyle & Entertainment
  'Gaming', 'Sports', 'Health', 'Travel', 'Food', 'Art', 'Music', 'Fashion',
  // Media & Communication
  'Social-media', 'Journalism', 'Publishing', 'Broadcasting', 'Marketing',
  // Science & Research
  'Science', 'Research', 'Medicine', 'Climate', 'Environment', 'Physics'
];

// 分类映射表
const CATEGORY_MAPPINGS: { [key: string]: string } = {
  'tech': 'Software',
  'technology': 'Software', 
  'TECH': 'Software',
  'TECHNOLOGY': 'Software',
  'Tech': 'Software',
  'crypto': 'Bitcoin',
  'CRYPTO': 'Bitcoin',
  'Crypto': 'Bitcoin',
  'cryptocurrency': 'Bitcoin',
  'blockchain': 'Bitcoin',
  'BLOCKCHAIN': 'Bitcoin',
  'Blockchain': 'Bitcoin',
  'political': 'Politics',
  'POLITICS': 'Politics',
  'politics': 'Politics',
  'BUSINESS': 'Business',
  'business': 'Business',
  'SPORTS': 'Sports',
  'sports': 'Sports',
  'sport': 'Sports',
  'SPORT': 'Sports',
  'GAMING': 'Gaming',
  'gaming': 'Gaming',
  'games': 'Gaming',
  'GAMES': 'Gaming',
  'AI': 'Ai',
  'ai': 'Ai',
  'defi': 'Defi',
  'DEFI': 'Defi',
  'DeFi': 'Defi',
  'nft': 'Nft',
  'NFT': 'Nft',
  'nfts': 'Nft',
  'NFTS': 'Nft',
  'entertainment': 'Gaming',
  'ENTERTAINMENT': 'Gaming',
  'Entertainment': 'Gaming',
  'history': 'Culture',
  'HISTORY': 'Culture',
  'History': 'Culture',
};

/**
 * 使用 Gemini AI 生成文章分析和分类
 */
export async function generateArticleAnalysis(
  content: string,
  title: string
): Promise<ArticleAnalysis> {
  try {
    const currentModel = initialize();
    if (!currentModel) {
      throw new Error('Failed to initialize Gemini model');
    }
    
    const prompt = `You are an expert content analyst. Analyze this article and provide:

1. LANGUAGE: Detect the primary language (use ISO 639-1 codes like en, zh, es, fr, etc.)
2. CATEGORY: Choose ONE specific category from this list:

CRYPTOCURRENCY:
Bitcoin, Ethereum, Solana, Defi, Memecoin, Trading, Mining, Wallet, Nft, Dao

TECHNOLOGY:
Software, Hardware, Ai, Startup, Fintech, Biotech, Space

POLITICS:
Politics, Elections, Policy, International, Security, Education, Culture

BUSINESS:
Business, Economics, Markets, Investment, Banking, Energy, Real-estate

LIFESTYLE:
Gaming, Sports, Health, Travel, Food, Art, Music, Fashion

MEDIA:
Social-media, Journalism, Publishing, Broadcasting, Marketing

SCIENCE:
Science, Research, Medicine, Climate, Environment, Physics

RULES:
- Read the FULL content, not just the title
- Choose the MOST SPECIFIC category
- Wars/conflicts/massacres = International
- Crypto content = specific crypto category (Bitcoin, Defi, etc.)
- Tech companies = Hardware or Software
- Gaming = Gaming (not Politics or Entertainment)
- Political events = Politics or International

3. SUMMARY: Write two concise paragraphs (Chinese first, then English)

OUTPUT FORMAT:
LANGUAGE: [language code]
CATEGORY: [exact category name]

[Chinese summary paragraph]

[English summary paragraph]

Article Title: ${title}

Article Content:
${content.substring(0, 8000)}`;

    const result = await currentModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 解析语言
    const languageMatch = text.match(/LANGUAGE:\s*([^\n]+)/i);
    const language = languageMatch ? languageMatch[1].trim() : 'en';
    
    // 解析分类
    const categoryMatch = text.match(/CATEGORY:\s*([^\n]+)/i);
    let rawCategory = categoryMatch ? categoryMatch[1].trim() : 'Business';
    
    // 修正分类
    const category = CATEGORY_MAPPINGS[rawCategory] || 
                    VALID_CATEGORIES.find(cat => cat.toLowerCase() === rawCategory.toLowerCase()) ||
                    'Business';

    // 解析总结
    const cleanText = text.replace(/LANGUAGE:\s*[^\n]+\n?/i, '').replace(/CATEGORY:\s*[^\n]+\n?/i, '').trim();
    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim());
    
    let summary: ArticleSummary;
    
    if (paragraphs.length >= 2) {
      summary = {
        chinese: paragraphs[0].trim(),
        english: paragraphs[1].trim()
      };
    } else {
      summary = {
        chinese: cleanText,
        english: cleanText
      };
    }

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
 * 使用 Gemini AI 生成文章总结（保持向后兼容）
 */
export async function generateArticleSummary(
  content: string,
  title: string
): Promise<ArticleSummary> {
  const analysis = await generateArticleAnalysis(content, title);
  return analysis.summary;
}

/**
 * 检查 Gemini API 连接状态
 */
export async function testConnection(): Promise<boolean> {
  try {
    const currentModel = initialize();
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

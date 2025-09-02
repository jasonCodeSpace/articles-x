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

export interface ArticleAnalysis {
  summary: ArticleSummary;
  category: string;
  language: string;
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
3. Write two summary paragraphs (Chinese first, then English)

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

OUTPUT FORMAT:
LANGUAGE: [code]
CATEGORY: [category]

[Chinese paragraph]

[English paragraph]

Title: ${title}
Content: ${content.substring(0, 6000)}`;

    const result = await currentModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 解析结果
    const languageMatch = text.match(/LANGUAGE:\s*([^\n]+)/i);
    const language = languageMatch ? languageMatch[1].trim() : 'en';
    
    const categoryMatch = text.match(/CATEGORY:\s*([^\n]+)/i);
    let rawCategory = categoryMatch ? categoryMatch[1].trim() : 'Business';
    
    // 验证分类
    const category = VALID_CATEGORIES.find(cat => 
      cat.toLowerCase() === rawCategory.toLowerCase()
    ) || 'Business';

    // 解析总结
    const cleanText = text.replace(/LANGUAGE:\s*[^\n]+\n?/i, '')
                         .replace(/CATEGORY:\s*[^\n]+\n?/i, '')
                         .trim();
    
    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim());
    
    const summary: ArticleSummary = {
      chinese: paragraphs[0]?.trim() || cleanText,
      english: paragraphs[1]?.trim() || cleanText
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

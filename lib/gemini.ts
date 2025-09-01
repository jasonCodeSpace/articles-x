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

/**
 * 使用 AI生成文章总结和分类
 * @param content 文章内容
 * @param title 文章标题
 * @returns 包含中文和英文总结以及分类的对象
 */
export async function generateArticleAnalysis(
  content: string,
  title: string
): Promise<ArticleAnalysis> {
  try {
    const currentModel = initialize();
    if (!currentModel) {
      throw new Error('Failed to initialize  model');
    }
    
    // 构建提示词，包含摘要生成、分类、语言检测和英文翻译
    const prompt = `TASK: Read the article and perform four tasks:
1. Detect the primary language of the article
2. Categorize the article with ONE category from the provided list
3. Produce an ULTRA-CONCISE, read-aloud friendly summary in English and Chinese
4. If the article is not in English, provide English translations of title, tweet text, preview text, and full content

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
Select ONE category that best fits this article from the following list. 
IMPORTANT: Output EXACTLY as written below with proper capitalization (first letter uppercase, rest lowercase).

CRYPTOCURRENCY & BLOCKCHAIN (choose most specific):
Bitcoin, Ethereum, Solana, Defi, Memecoin, Trading, Mining, Wallet, Nft, Dao

TECHNOLOGY & INNOVATION:
Software, Hardware, Ai, Startup, Fintech, Biotech, Space

POLITICS & SOCIETY:
Politics, Elections, Policy, International, Security, Education, Culture

BUSINESS & ECONOMICS:
Business, Economics, Markets, Investment, Banking, Energy, Real-estate

LIFESTYLE & ENTERTAINMENT:
Gaming, Sports, Health, Travel, Food, Art, Music, Fashion

MEDIA & COMMUNICATION:
Social-media, Journalism, Publishing, Broadcasting, Marketing

SCIENCE & RESEARCH:
Science, Research, Medicine, Climate, Environment, Physics

CLASSIFICATION GUIDELINES:
READ THE CONTENT CAREFULLY. Choose the MOST SPECIFIC category based on the PRIMARY TOPIC.

CRYPTOCURRENCY CONTENT:
- Bitcoin price, analysis, adoption → Bitcoin
- Ethereum updates, gas fees, ETH → Ethereum  
- Solana ecosystem, SOL token → Solana
- DeFi protocols, yield farming, lending, DEX → Defi
- Memecoins, DOGE, SHIB, pump.fun → Memecoin
- Crypto trading strategies, market analysis → Trading
- Mining operations, miners, hashrate → Mining
- Crypto wallets, security → Wallet
- NFT collections, digital art, OpenSea → Nft
- DAOs, governance tokens → Dao

TECHNOLOGY CONTENT:
- Software companies, apps, SaaS → Software
- Hardware devices, chips, phones → Hardware
- AI/ML, ChatGPT, LLMs, machine learning → Ai
- New companies, funding rounds → Startup
- Financial technology, payments → Fintech
- Space exploration, rockets → Space
- Biotechnology, medical tech → Biotech

BUSINESS & FINANCE:
- Company news, earnings, corporate → Business
- Economic indicators, inflation, GDP → Economics
- Stock markets, trading, Wall Street → Markets
- Investment strategies, funds → Investment
- Banking sector, loans → Banking
- Oil, gas, renewable energy → Energy
- Property, housing market → Real-estate

POLITICS & SOCIETY:
- Government, politicians, laws → Politics
- Voting, campaigns, candidates → Elections
- Public policy, regulations → Policy
- International relations, diplomacy → International
- National security, military → Security
- Schools, universities, learning → Education
- Arts, traditions, society → Culture

EXAMPLES WITH REASONING:
- "Tesla FSD autonomous driving" → Hardware (car technology)
- "Foot Locker x Habbo partnership" → Gaming (gaming platform collaboration)
- "World Liberty Financial stablecoin" → Defi (DeFi protocol/stablecoin)
- "Bitcoin ETF approval" → Bitcoin (Bitcoin-specific news)
- "ChatGPT new features" → Ai (AI technology)
- "Election polling data" → Elections (election-related)
- "Tesla stock price surge" → Markets (stock market)
- "New startup raises $50M" → Startup (startup funding)

ROLE
TTS-ready summarizer. Output EXACTLY two paragraphs: first Chinese, then English.
No headings or labels. 不要出现"总结"二字。

TASK
Read ARTICLE. Write an ultra-concise, natural, read-aloud description for someone who hasn't read it.
Maximize information density. Do NOT omit key facts, names, dates, or numbers. Do NOT invent.

OUTPUT
Two SINGLE coherent paragraphs (Chinese → English). Neutral tone. Short sentences.

TTS RULES
- Numbers in words, not digits.
  • CN: 年份用"二零二三年"；数量/金额/百分比用"一千九百万美元""约百分之十七"；区间如"一百一十万到一百二十万每天"。
  • EN: years as "twenty twenty-two"; spell amounts/percents; ranges spelled out.
- No symbols: $, %, ~, /, k, M, B. Spell them.
- Expand acronyms to readable forms (both languages): EVM, USDC, MIT, HFT, DeFi, DEX, CMO, NYSE, KOL 等。
- Handles写作"在 X 平台的 …" / "... on X".

CONTENT RULES
- 必含：是什么、为何重要、谁参与（姓名/职务/投资方）、关键机制或事件、关键数值与日期、应对或策略、结论。
- 长清单：列三到五个代表名称 + "等/and others"，并给总量或比例。
- 中英尽量信息对齐；无引号、无链接、无项目符号、无表情。
- 若信息缺失：写"未提及" / "not stated"。

OUTPUT FORMAT:
LANGUAGE: [detected language code]
CATEGORY: [selected category - EXACTLY as listed above with proper capitalization]

[Chinese paragraph]

[English paragraph]

CRITICAL REQUIREMENTS:
- CATEGORY must be EXACTLY one of the categories listed above
- Use proper capitalization: First letter uppercase, rest lowercase
- NO variations like "TECH", "tech", "Technology" - use "Software", "Hardware", or "Ai"
- NO generic categories like "Crypto" - use specific ones like "Bitcoin", "Defi", "Memecoin"
- Choose the MOST SPECIFIC category that fits

ENGLISH_TRANSLATION: [only if article language is not English]
TITLE: [English translation of title]
TWEET_TEXT: [English translation of tweet text]
PREVIEW_TEXT: [English translation of preview text]
FULL_CONTENT: [English translation of full content]

RULES:
- No intro/outro, no repetition, no adjectives unless essential.
- Prefer active voice; keep parallel structure across bullets.
- If the article omits something important, write "not stated".
- If space is tight, do not drop key points—slightly exceed the targets instead.
- Do not use asterisk symbols in the output.
- Choose the most specific and relevant category.
- Detect language based on the actual content, not the title.
- For English translations: maintain original meaning, use natural English, preserve technical terms and proper nouns.
- For English translations: ALWAYS provide actual translations, never use "not applicable", "not stated", or similar phrases.
- If article is already in English, do not include ENGLISH_TRANSLATION section.

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
    let rawCategory = categoryMatch ? categoryMatch[1].trim() : 'Software'; // 默认分类
    
    // 定义有效分类列表
    const validCategories = [
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
    
    // 分类映射表 - 将常见的错误分类映射到正确的分类
    const categoryMappings: { [key: string]: string } = {
      // Technology variations
      'tech': 'Software',
      'technology': 'Software', 
      'TECH': 'Software',
      'TECHNOLOGY': 'Software',
      'Tech': 'Software',
      
      // Crypto variations
      'crypto': 'Bitcoin',
      'CRYPTO': 'Bitcoin',
      'Crypto': 'Bitcoin',
      'cryptocurrency': 'Bitcoin',
      'blockchain': 'Bitcoin',
      'BLOCKCHAIN': 'Bitcoin',
      'Blockchain': 'Bitcoin',
      
      // Politics variations
      'political': 'Politics',
      'POLITICS': 'Politics',
      'politics': 'Politics',
      
      // Business variations
      'BUSINESS': 'Business',
      'business': 'Business',
      
      // Sports variations
      'SPORTS': 'Sports',
      'sports': 'Sports',
      'sport': 'Sports',
      'SPORT': 'Sports',
      
      // Gaming variations
      'GAMING': 'Gaming',
      'gaming': 'Gaming',
      'games': 'Gaming',
      'GAMES': 'Gaming',
      
      // AI variations
      'AI': 'Ai',
      'ai': 'Ai',
      'artificial intelligence': 'Ai',
      'machine learning': 'Ai',
      'ML': 'Ai',
      
      // DeFi variations
      'defi': 'Defi',
      'DEFI': 'Defi',
      'DeFi': 'Defi',
      
      // NFT variations
      'nft': 'Nft',
      'NFT': 'Nft',
      'nfts': 'Nft',
      'NFTS': 'Nft',
    };
    
    // 修正分类
    const category = categoryMappings[rawCategory] || 
                    validCategories.find(cat => cat.toLowerCase() === rawCategory.toLowerCase()) ||
                    'Software'; // 默认分类

    // 解析响应，新格式：中文段落在前，英文段落在后
    // 移除LANGUAGE和CATEGORY行，然后按段落分割
    const cleanText = text.replace(/LANGUAGE:\s*[^\n]+\n?/i, '').replace(/CATEGORY:\s*[^\n]+\n?/i, '').trim();
    
    // 按ENGLISH_TRANSLATION分割，取前面的部分
    const summaryPart = cleanText.split(/ENGLISH_TRANSLATION/i)[0].trim();
    
    // 按段落分割（两个连续换行符）
    const paragraphs = summaryPart.split(/\n\s*\n/).filter(p => p.trim());
    
    let summary: ArticleSummary;
    
    if (paragraphs.length >= 2) {
      summary = {
        chinese: paragraphs[0].trim(),
        english: paragraphs[1].trim()
      };
    } else if (paragraphs.length === 1) {
      // 如果只有一个段落，尝试按行分割
      const lines = paragraphs[0].split('\n').filter(line => line.trim());
      const midPoint = Math.floor(lines.length / 2);
      summary = {
        chinese: lines.slice(0, midPoint).join('\n').trim(),
        english: lines.slice(midPoint).join('\n').trim()
      };
    } else {
      // 备用方案
      summary = {
        chinese: summaryPart,
        english: summaryPart
      };
    }

    // 移除所有星号符号
    summary.english = summary.english.replace(/\*/g, '');
    summary.chinese = summary.chinese.replace(/\*/g, '');

    // 解析英文翻译（如果存在）
    let english_translation: ArticleTranslation | undefined;
    const translationMatch = text.match(/ENGLISH_TRANSLATION:[\s\S]*$/i);
    
    if (translationMatch && language !== 'en') {
      const translationText = translationMatch[0];
      const titleMatch = translationText.match(/TITLE:\s*([^\n]+)/i);
      const tweetMatch = translationText.match(/TWEET_TEXT:\s*([^\n]+)/i);
      const previewMatch = translationText.match(/PREVIEW_TEXT:\s*([^\n]+)/i);
      const contentMatch = translationText.match(/FULL_CONTENT:\s*([\s\S]*?)(?=\n\w+:|$)/i);
      
      // 过滤无效翻译值的函数
       const isValidTranslation = (text: string): boolean => {
         const invalidValues = ['not applicable', 'not stated', 'n/a', 'na', 'none', 'null', 'undefined'];
         return Boolean(text) && !invalidValues.includes(text.toLowerCase().trim());
       };
      
      if (titleMatch || tweetMatch || previewMatch || contentMatch) {
        const titleText = titleMatch ? titleMatch[1].trim() : '';
        const tweetText = tweetMatch ? tweetMatch[1].trim() : '';
        const previewText = previewMatch ? previewMatch[1].trim() : '';
        const contentText = contentMatch ? contentMatch[1].trim() : '';
        
        english_translation = {
          title: isValidTranslation(titleText) ? titleText : title,
          tweet_text: isValidTranslation(tweetText) ? tweetText : '',
          article_preview_text: isValidTranslation(previewText) ? previewText : '',
          full_article_content: isValidTranslation(contentText) ? contentText : content.substring(0, 8000)
        };
      }
    }

    return {
      summary,
      category,
      language,
      english_translation
    };
  } catch (error) {
    console.error('Error generating article analysis:', error);
    throw new Error('Failed to generate article analysis');
  }
}

/**
 * 使用 AI生成文章总结（保持向后兼容）
 * @param content 文章内容
 * @param title 文章标题
 * @returns 包含中文和英文总结的对象
 */
export async function generateArticleSummary(
  content: string,
  title: string
): Promise<ArticleSummary> {
  try {
    const currentModel = initialize();
    if (!currentModel) {
      throw new Error('Failed to initialize  model');
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
 * 检查 API连接状态
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
    console.error(' API connection test failed:', error);
    return false;
  }
}
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { checkApiLimit, recordApiCall } from '@/lib/api-usage-tracker';

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

// ArticleTranslation 接口移动到翻译相关文件中

export interface ArticleAnalysis {
  summary: ArticleSummary;
  language: string;
  category?: string;
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
    // 检查 Gemini API 每日调用限制
    const apiLimitCheck = checkApiLimit('gemini');
    if (!apiLimitCheck.allowed) {
      throw new Error(`Daily Gemini API limit exceeded: ${apiLimitCheck.message}`);
    }

    // 记录 API 调用
    const apiCallResult = recordApiCall('gemini');
    if (!apiCallResult.success) {
      throw new Error('Daily Gemini API limit exceeded during call recording');
    }

    const currentModel = initialize();
    if (!currentModel) {
      throw new Error('Failed to initialize  model');
    }
    
    // 构建提示词，只包含摘要生成、语言检测和分类
    const prompt = `CRITICAL: You MUST follow this EXACT output format. Any deviation will cause system failure.

TASK: Analyze this article and provide the response in the EXACT format specified below.

You must:
1. Detect the primary language of the article
2. Produce an ULTRA-CONCISE, read-aloud friendly summary in English and Chinese
3. Categorize the article

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

ROLE
TTS-ready summarizer. Output EXACTLY two sections: first Chinese (2-3 paragraphs), then English (2-3 paragraphs).
NO headings, labels, markers, asterisks, or format indicators of ANY kind.
Do NOT use "总结", "概要", "Summary", "Chinese", "English", "Paragraph" or any similar words.

TASK
Read ARTICLE. Write a comprehensive, natural, read-aloud description for someone who hasn't read it.
Target approximately 300 words for EACH language section. Maximize information density. Do NOT omit key facts, names, dates, or numbers. Do NOT invent.

OUTPUT
Two sections (Chinese → English), each containing 2-3 coherent paragraphs totaling ~300 words per language. Neutral tone. Varied sentence lengths for natural flow.
Start directly with content - NO format markers or labels.

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

OUTPUT FORMAT (FOLLOW EXACTLY):
LANGUAGE: [detected language code]

[Chinese paragraph 1]

[Chinese paragraph 2]

[Chinese paragraph 3 if needed]

[English paragraph 1]

[English paragraph 2]

[English paragraph 3 if needed]

CATEGORY: [Select up to 3 categories from: Hardware, Gaming, Health, Environment, Personal Story, Culture, Philosophy, History, Education, Design, Marketing, AI, Crypto, Tech, Data, Startups, Business, Markets, Product, Security, Policy, Science, Media. Separate multiple categories with commas. 

CATEGORY GUIDELINES:

- Hardware: 硬件与器件的设计、制造与评测。包含：芯片、终端、IoT、拆解、供应链工艺；不含：纯软件工程（→ Tech）、AI算法（→ AI）。
- Gaming: 游戏与电竞生态。包含：作品评测、运营与赛事、游戏设计与商业化；不含：博彩/金融化市场（→ Markets）、通用软件工程（→ Tech）。
- Health: 健康与医疗。包含：临床研究、公共卫生、心理健康、营养与运动医学；不含：环境政策（→ Environment）、可穿戴硬件评测（→ Hardware）。
- Environment: 环境与气候/能源转型。包含：减排、碳市场、生态与可持续实践；不含：基础科学机理（→ Science）、纯政策法规解读（→ Policy）。
- Personal Story: 第一人称经历与人生体悟。包含：经验复盘、职业/生活故事；不含：行业新闻与分析（→ Media/Business/Markets）。
- Culture: 文化与社会现象。包含：艺术、文学、亚文化与网络文化解读；不含：媒体产业与平台策略（→ Media）、品牌营销（→ Marketing）。
- Philosophy: 哲学与伦理思辨。包含：认识论、价值与技术伦理；不含：可执行的商业/产品方法（→ Business/Product）。
- History: 历史与史料解读。包含：事件脉络、人物与制度沿革；不含：当下新闻（→ Media）、政策落地操作（→ Policy）。
- Education: 教育方法与学习科学。包含：教学设计、评估体系、学习工具与策略；不含：研究成果本身（→ Science）、产品功能教程（→ Product/Tech）。
- Design: 设计学科与实践。包含：UX/UI、视觉与品牌、工业设计与设计系统；不含：代码实现（→ Tech）、营销投放与渠道（→ Marketing）。
- Marketing: 增长与营销。包含：渠道与投放、品牌与内容、增长模型与衡量；不含：定价与销售运营（→ Business）、产品路线（→ Product）。
- AI: 人工智能理论与应用。包含：模型/代理、训练与推理、应用落地与安全；不含：数据管道与BI（→ Data）、通用云与工程（→ Tech）、链上AI币（→ Crypto）。
- Crypto: 区块链与加密原生主题。包含：公链/协议、DeFi、NFT/RWA、钱包与治理、链上数据与行情；不含：传统宏观与股债（→ Markets）、AI非上链议题（→ AI）。
- Tech: 通用软件与基础设施工程。包含：云原生、架构、DevOps/平台工程、开发工具；不含：数据分析与指标（→ Data）、硬件（→ Hardware）、模型研发（→ AI）。
- Data: 数据工程与分析。包含：数据仓库/湖、ETL/ELT、指标体系、实验与可视化、MLOps（工程侧）；不含：模型方法与研究（→ AI）。
- Startups: 创业与早期公司。包含：PMF探索、融资、股权与团队、0→1 增长路径；不含：成熟企业运营与定价（→ Business）、宏观市场（→ Markets）。
- Business: 商业运营与变现。包含：定价与货币化、销售与渠道、组织与流程、单位经济学；不含：早期PMF/融资（→ Startups）、市场行情（→ Markets）。
- Markets: 宏观与资本市场（非加密为主）。包含：股债汇商品、宏观变量与交易框架；不含：加密原生市场（→ Crypto）、公司经营实务（→ Business）。
- Product: 产品管理与策略。包含：用户研究、定位与路线图、优先级与度量、A/B 与增长机制；不含：视觉/品牌（→ Design/Marketing）、工程实现（→ Tech）、定价（→ Business）。
- Security: 安全与隐私工程。包含：AppSec、InfraSec、红蓝对抗、合规技术、链上安全；不含：法律条文与政策解读（→ Policy）、可用性/性能工程（→ Tech）。
- Policy: 政策、法律与合规。包含：立法/监管解读、数据与隐私合规、治理框架；不含：技术实现（→ Security/Tech）、商业运营细节（→ Business）。
- Science: 基础与应用科学研究。包含：物理/化学/生物/空间等前沿成果与方法；不含：工程落地（→ Tech/Hardware）、气候治理实践（→ Environment）。
- Media: 媒体与创作者经济产业面。包含：平台策略（X/YouTube等）、分发与变现、新闻业与内容生态；不含：文化批评（→ Culture）、广告投放实务（→ Marketing）。

CRITICAL CLASSIFICATION RULES:
1. **Crypto分类规则：**
   - 仅当文章主要讨论区块链技术、加密货币、DeFi协议、NFT、代币经济学时才分类为Crypto
   - 如果加密货币只是个人故事的背景，不分类为Crypto
   - 绝对不要将政治、政策、国际关系、战争、人道主义危机等内容分类为Crypto
   - 绝对不要将环境、气候、能源等内容分类为Crypto
   - 绝对不要将健康、医疗、教育等内容分类为Crypto
   - 例子：分析"回购销毁 vs 收益共享"的加密协议 = Crypto + Tech
   - 例子：个人故事中提到在加密行业工作 = Personal Story（不含Crypto）
   - 例子："联合国加沙饥饿游戏" = Policy + Security（绝对不是Crypto）

2. **Business分类规则：**
   - 仅限于：定价与变现策略、GTM与销售运营、渠道与合作伙伴管理、组织流程优化、单位经济学分析
   - 绝对不包括：代币经济学技术分析、宏观市场分析、产品设计、融资话题
   - 例子："回购销毁"加密机制分析 = Crypto + Tech（不是Business）

3. **Personal Story分类规则：**
   - 必须是第一人称亲身经历：个人成长故事、职业经历分享、生活感悟
   - 如果提到职业或行业只是背景，重点关注个人体验方面
   - 除非文章提供该行业的实质性分析，否则不添加额外行业分类
   - 例子："Weed destroyed my life"有加密背景 = Personal Story + Culture（不含Crypto）

4. **Tech分类规则：**
   - 适用于：软件工程实践、云原生架构、DevOps工具链、开发框架
   - 也适用于：加密协议和区块链技术的技术分析
   - 不适用于：仅在个人故事中顺带提及技术

5. **其他规则：**
   - Markets分类仅限于：股票债券市场、宏观经济指标、传统金融工具交易
   - Media适用于媒体和创作者经济产业，不适用于文化批评（用Culture）
   - 严格按照文章的主要目的和内容分类，不要因为背景提及就错误分类]

IMPORTANT: You MUST follow this EXACT output format. Do not deviate from it.

RULES:
- No intro/outro, no repetition, no adjectives unless essential.
- Prefer active voice; keep parallel structure across bullets.
- Do not use asterisk symbols in the output.
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
    const category = categoryMatch ? categoryMatch[1].trim() : undefined;

    // 解析响应，新格式：中文段落在前，英文段落在后
    // 移除LANGUAGE行，然后按段落分割
    let cleanText = text.replace(/LANGUAGE:\s*[^\n]+\n?/i, '').trim();
    
    // 按CATEGORY分割，取前面的部分
    const summaryPart = cleanText.split(/CATEGORY/i)[0].trim();
    
    // 移除可能的格式标记
    cleanText = summaryPart
      .replace(/\*\*中文概要:\*\*/gi, '')
      .replace(/\*\*Chinese Paragraph:\*\*/gi, '')
      .replace(/\*\*中文概要：\*\*/gi, '')
      .replace(/\*\*Chinese Summary:\*\*/gi, '')
      .replace(/\*\*中文总结段落:\*\*/gi, '')
      .replace(/\*\*English Summary:\*\*/gi, '')
      .replace(/\*\*英文总结:\*\*/gi, '')
      .replace(/中文概要:/gi, '')
      .replace(/Chinese Paragraph:/gi, '')
      .replace(/Chinese Summary:/gi, '')
      .replace(/中文总结段落:/gi, '')
      .replace(/English Summary:/gi, '')
      .replace(/English paragraph:/gi, '')
      .replace(/英文总结:/gi, '')
      .replace(/\*\*/g, '') // 移除所有星号
      .trim();
    
    // 按段落分割（两个连续换行符）
    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim());
    
    let summary: ArticleSummary;
    
    if (paragraphs.length >= 2) {
      // 检测哪个段落是中文，哪个是英文
      const firstParagraph = paragraphs[0].trim();
      const secondParagraph = paragraphs[1].trim();
      
      // 简单的中文检测：包含中文字符
      const hasChinese = (text: string) => /[\u4e00-\u9fff]/.test(text);
      
      if (hasChinese(firstParagraph) && !hasChinese(secondParagraph)) {
        // 第一段是中文，第二段是英文
        summary = {
          chinese: firstParagraph,
          english: secondParagraph
        };
      } else if (!hasChinese(firstParagraph) && hasChinese(secondParagraph)) {
        // 第一段是英文，第二段是中文
        summary = {
          chinese: secondParagraph,
          english: firstParagraph
        };
      } else {
        // 都是中文或都是英文，按顺序处理
        summary = {
          chinese: firstParagraph,
          english: secondParagraph
        };
      }
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

    // 不再生成英文翻译，这将由专门的翻译定时任务处理

    return {
      summary,
      language,
      category
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
    // 检查 Gemini API 每日调用限制
    const apiLimitCheck = checkApiLimit('gemini');
    if (!apiLimitCheck.allowed) {
      throw new Error(`Daily Gemini API limit exceeded: ${apiLimitCheck.message}`);
    }

    // 记录 API 调用
    const apiCallResult = recordApiCall('gemini');
    if (!apiCallResult.success) {
      throw new Error('Daily Gemini API limit exceeded during call recording');
    }

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
 * 生成文章分类
 * @param title 文章标题
 * @param content 文章内容
 * @returns 分类数组
 */
export async function generateCategories(
  title: string,
  content: string
): Promise<string[]> {
  try {
    // 检查 Gemini API 每日调用限制
    const apiLimitCheck = checkApiLimit('gemini');
    if (!apiLimitCheck.allowed) {
      throw new Error(`Daily Gemini API limit exceeded: ${apiLimitCheck.message}`);
    }

    // 记录 API 调用
    const apiCallResult = recordApiCall('gemini');
    if (!apiCallResult.success) {
      throw new Error('Daily Gemini API limit exceeded during call recording');
    }

    const currentModel = initialize();
    if (!currentModel) {
      throw new Error('Failed to initialize model');
    }
    
    // 允许的分类列表
    const allowedCategories = [
      'Hardware', 'Gaming', 'Health', 'Environment', 'Personal Story', 'Culture',
      'Philosophy', 'History', 'Education', 'Design', 'Marketing', 'AI', 'Crypto',
      'Tech', 'Data', 'Startups', 'Business', 'Markets', 'Product', 'Security',
      'Policy', 'Science', 'Media'
    ];
    
    // 构建专门用于分类的提示词
    const prompt = `TASK: Analyze the article and assign 1-3 most relevant categories.

CRITICAL RULES:
1. You MUST select 1-3 categories from the allowed list
2. You CANNOT create new categories
3. You CANNOT use categories not in the allowed list
4. Select the MOST RELEVANT categories, prioritizing specificity
5. Maximum 3 categories, minimum 1 category

ALLOWED CATEGORIES (choose 1-3 most relevant):

Hardware — 硬件与器件的设计、制造与评测。包含：芯片、终端、IoT、拆解、供应链工艺；不含：纯软件工程（→ Tech）、AI算法（→ AI）。

Gaming — 游戏与电竞生态。包含：作品评测、运营与赛事、游戏设计与商业化；不含：博彩/金融化市场（→ Markets）、通用软件工程（→ Tech）。

Health — 健康与医疗。包含：临床研究、公共卫生、心理健康、营养与运动医学；不含：环境政策（→ Environment）、可穿戴硬件评测（→ Hardware）。

Environment — 环境与气候/能源转型。包含：减排、碳市场、生态与可持续实践；不含：基础科学机理（→ Science）、纯政策法规解读（→ Policy）。

Personal Story — 第一人称经历与人生体悟。包含：经验复盘、职业/生活故事；不含：行业新闻与分析（→ Media/Business/Markets）。

Culture — 文化与社会现象。包含：艺术、文学、亚文化与网络文化解读；不含：媒体产业与平台策略（→ Media）、品牌营销（→ Marketing）。

Philosophy — 哲学与伦理思辨。包含：认识论、价值与技术伦理；不含：可执行的商业/产品方法（→ Business/Product）。

History — 历史与史料解读。包含：事件脉络、人物与制度沿革；不含：当下新闻（→ Media）、政策落地操作（→ Policy）。

Education — 教育方法与学习科学。包含：教学设计、评估体系、学习工具与策略；不含：研究成果本身（→ Science）、产品功能教程（→ Product/Tech）。

Design — 设计学科与实践。包含：UX/UI、视觉与品牌、工业设计与设计系统；不含：代码实现（→ Tech）、营销投放与渠道（→ Marketing）。

Marketing — 增长与营销。包含：渠道与投放、品牌与内容、增长模型与衡量；不含：定价与销售运营（→ Business）、产品路线（→ Product）。

AI — 人工智能理论与应用。包含：模型/代理、训练与推理、应用落地与安全；不含：数据管道与BI（→ Data）、通用云与工程（→ Tech）、链上AI币（→ Crypto）。

Crypto — 区块链与加密原生主题。包含：公链/协议、DeFi、NFT/RWA、钱包与治理、链上数据与行情；不含：传统宏观与股债（→ Markets）、AI非上链议题（→ AI）。

Tech — 通用软件与基础设施工程。包含：云原生、架构、DevOps/平台工程、开发工具；不含：数据分析与指标（→ Data）、硬件（→ Hardware）、模型研发（→ AI）。

Data — 数据工程与分析。包含：数据仓库/湖、ETL/ELT、指标体系、实验与可视化、MLOps（工程侧）；不含：模型方法与研究（→ AI）。

Startups — 创业与早期公司。包含：PMF探索、融资、股权与团队、0→1 增长路径；不含：成熟企业运营与定价（→ Business）、宏观市场（→ Markets）。

Business — 商业运营与变现。包含：定价与货币化、销售与渠道、组织与流程、单位经济学；不含：早期PMF/融资（→ Startups）、市场行情（→ Markets）。

Markets — 宏观与资本市场（非加密为主）。包含：股债汇商品、宏观变量与交易框架；不含：加密原生市场（→ Crypto）、公司经营实务（→ Business）。

Product — 产品管理与策略。包含：用户研究、定位与路线图、优先级与度量、A/B 与增长机制；不含：视觉/品牌（→ Design/Marketing）、工程实现（→ Tech）、定价（→ Business）。

Security — 安全与隐私工程。包含：AppSec、InfraSec、红蓝对抗、合规技术、链上安全；不含：法律条文与政策解读（→ Policy）、可用性/性能工程（→ Tech）。

Policy — 政策、法律与合规。包含：立法/监管解读、数据与隐私合规、治理框架；不含：技术实现（→ Security/Tech）、商业运营细节（→ Business）。

Science — 基础与应用科学研究。包含：物理/化学/生物/空间等前沿成果与方法；不含：工程落地（→ Tech/Hardware）、气候治理实践（→ Environment）。

Media — 媒体与创作者经济产业面。包含：平台策略（X/YouTube等）、分发与变现、新闻业与内容生态；不含：文化批评（→ Culture）、广告投放实务（→ Marketing）。

CRITICAL CLASSIFICATION RULES:

1. **ALLOWED CATEGORIES ONLY**: You MUST only use categories from the allowed list exactly as written
2. **MAXIMUM 3 CATEGORIES**: Select 1-3 most relevant categories, never more
3. **EXACT MATCH**: Category names must match the allowed list exactly
4. **NO FORBIDDEN CATEGORIES**: Never use Politics, Law, Crime, Robotics, Auto, Space, Sociology or any other unlisted categories

SPECIFIC GUIDELINES:

- **Crypto**: For blockchain technology, cryptocurrency, DeFi protocols, NFT, token economics
- **Personal Story**: For first-person personal experience, growth story, life insights
- **Business**: For pricing/monetization, sales operations, organizational processes, unit economics
- **Tech**: For software engineering, cloud architecture, DevOps, development frameworks
- **Markets**: For traditional financial markets (stocks, bonds), macro economics
- **Policy**: For legislation, regulation, compliance frameworks (use instead of Politics/Law)
- **Media**: For media industry, creator economy, platform strategies
- **Culture**: For arts, literature, social phenomena, cultural criticism
- **Security**: For cybersecurity, data protection, privacy (use instead of Crime)
- **Science**: For scientific research, discoveries (use instead of Space/Sociology)

INSTRUCTIONS:
1. Read the article carefully and identify the main themes
2. Select 1-3 most relevant categories from the allowed list
3. Prioritize specificity over generality
4. Map forbidden categories to allowed ones (Politics→Policy, Crime→Security, etc.)
5. Never use categories not in the allowed list

OUTPUT FORMAT:
CATEGORIES: [List categories separated by commas, maximum 3]

ARTICLE:
Title: ${title}
Content: ${content.substring(0, 4000)}

Analyze and select 1-3 most relevant categories:`;
     
     const result = await currentModel.generateContent(prompt);
      const text = result.response.text();
      
      // 解析分类 - 支持1-3个分类
      const categoryMatch = text.match(/CATEGORIES:\s*([^\n]+)/i);
      if (categoryMatch) {
        const categoriesText = categoryMatch[1].trim();
        const categories = categoriesText
          .split(',')
          .map(cat => cat.trim())
          .filter(cat => allowedCategories.includes(cat))
          .slice(0, 3); // 最多3个分类
        
        if (categories.length > 0) {
          return categories;
        }
      }
      
      // 备用方案：在响应中查找任何允许的分类
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
 * 检查 API连接状态
 */
export async function testConnection(): Promise<boolean> {
  try {
    // 检查 Gemini API 每日调用限制
    const apiLimitCheck = checkApiLimit('gemini');
    if (!apiLimitCheck.allowed) {
      console.error(`Daily Gemini API limit exceeded: ${apiLimitCheck.message}`);
      return false;
    }

    // 记录 API 调用
    const apiCallResult = recordApiCall('gemini');
    if (!apiCallResult.success) {
      console.error('Daily Gemini API limit exceeded during call recording');
      return false;
    }

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

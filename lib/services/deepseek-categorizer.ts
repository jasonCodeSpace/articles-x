/**
 * DeepSeek-based Article Categorizer
 * Uses AI to intelligently categorize articles based on title and summary
 */

// All available categories for the AI to choose from
export const AVAILABLE_CATEGORIES = [
  // Tech
  { id: 'tech:ai', name: 'AI', description: 'Artificial intelligence, machine learning, LLMs, GPT, Claude, neural networks, deep learning' },
  { id: 'tech:crypto', name: 'Crypto', description: 'Cryptocurrency, Bitcoin, Ethereum, blockchain, DeFi, Web3, NFTs, tokens' },
  { id: 'tech:data', name: 'Data & Code', description: 'Programming, development tools, guides, tutorials, APIs, software, automation, agentic AI' },
  { id: 'tech:security', name: 'Security', description: 'Cybersecurity, hacking, privacy, encryption, vulnerabilities, data breaches' },
  { id: 'tech:hardware', name: 'Hardware', description: 'Chips, semiconductors, GPUs, CPUs, devices, NVIDIA' },

  // Business
  { id: 'business:startups', name: 'Startups', description: 'Startups, founders, entrepreneurship, Y Combinator, venture capital, pitching' },
  { id: 'business:markets', name: 'Markets & Finance', description: 'Stocks, trading, investing, economy, money, wealth, income, debt, financial markets' },
  { id: 'business:marketing', name: 'Marketing', description: 'Marketing, branding, advertising, SEO, growth hacking, lead generation' },

  // Product
  { id: 'product:product', name: 'Product Management', description: 'Product management, UX research, product strategy, roadmaps, KPIs, metrics' },
  { id: 'product:design', name: 'Design', description: 'UI/UX design, Figma, design systems, typography, branding, visual design' },
  { id: 'product:gaming', name: 'Gaming', description: 'Video games, gaming culture, esports, consoles, PC gaming, game development' },

  // Science
  { id: 'science:science', name: 'Science', description: 'Physics, chemistry, biology, experiments, laboratory research, quantum science, astrophysics' },
  { id: 'science:health', name: 'Health', description: 'Medical, medicine, doctors, hospitals, diseases, treatments, clinical trials, healthcare' },
  { id: 'science:education', name: 'Education', description: 'Schools, universities, colleges, professors, classrooms, curriculum, academic degrees' },
  { id: 'science:environment', name: 'Environment', description: 'Climate, environment, sustainability, pollution, renewable energy, ecosystems' },

  // Culture
  { id: 'culture:media', name: 'Media', description: 'Journalism, media, news, Twitter/X, social platforms' },
  { id: 'culture:culture', name: 'Culture', description: 'Pop culture, trends, internet culture, memes, viral content, influencers, entertainment' },
  { id: 'culture:philosophy', name: 'Philosophy', description: 'Philosophy, ethics, thinking, mindset, wisdom, life advice, habits, productivity, happiness, meaning' },
  { id: 'culture:history', name: 'History', description: 'History, historical events, centuries, eras, ancient civilizations, wars, heritage' },
  { id: 'culture:policy', name: 'Policy', description: 'Policy, politics, government, regulations, laws, elections' },
  { id: 'culture:personal-story', name: 'Personal Story', description: 'Personal stories, memoirs, life journeys, personal essays, reflections' }
]

export interface CategoryAssignment {
  main_category: string
  sub_category: string
  category_combined: string
}

export interface MultiCategoryAssignment {
  primary: CategoryAssignment
  categories: string[]  // All matching categories
  reasoning?: string    // AI's reasoning for the classification
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

/**
 * Call DeepSeek API for categorization
 */
async function callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY environment variable not set')
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.1,  // Low temperature for consistent classification
      max_tokens: 500
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} ${errorText}`)
  }

  const data: DeepSeekResponse = await response.json()
  return data.choices[0]?.message?.content || ''
}

/**
 * Parse AI response to extract categories and reasoning
 */
function parseAIResponse(response: string): { categories: string[], reasoning: string } {
  const categories: string[] = []
  let reasoning = ''

  // Try to extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.categories && Array.isArray(parsed.categories)) {
        categories.push(...parsed.categories)
      }
      if (parsed.reasoning) {
        reasoning = parsed.reasoning
      }
    } catch {
      // JSON parse failed, fall back to regex extraction
    }
  }

  // Fallback: extract category IDs like 'tech:ai', 'business:markets', etc.
  const categoryPattern = /(tech|business|product|science|culture):(ai|crypto|data|security|hardware|startups|markets|marketing|product|design|gaming|science|health|education|environment|media|culture|philosophy|history|policy|personal-story)/gi
  const matches = response.matchAll(categoryPattern)
  for (const match of matches) {
    const category = `${match[1]}:${match[2]}`
    if (!categories.includes(category)) {
      categories.push(category)
    }
  }

  // Extract reasoning (text before or after JSON)
  const lines = response.split('\n').filter(l => l.trim())
  if (lines.length > 0 && !reasoning) {
    reasoning = lines.join(' ').substring(0, 200)
  }

  return { categories, reasoning }
}

/**
 * Categorize an article using DeepSeek AI
 */
export async function categorizeWithDeepSeek(
  title: string,
  titleEnglish: string | null,
  summaryEnglish: string | null = null,
  summaryChinese: string | null = null
): Promise<MultiCategoryAssignment> {
  const titleToUse = titleEnglish || title

  // Build category list for the prompt
  const categoryList = AVAILABLE_CATEGORIES.map(cat =>
    `- ${cat.id}: ${cat.description}`
  ).join('\n')

  const systemPrompt = `You are an article classification expert. Your task is to categorize articles into the most appropriate categories.

Available categories:
${categoryList}

Rules:
1. Select 1-3 categories that best fit the article
2. The first category should be the PRIMARY category (best fit)
3. Return ONLY valid category IDs from the list above (e.g., "tech:ai", "culture:philosophy")
4. Respond in JSON format: { "categories": ["tech:ai", "culture:philosophy"], "reasoning": "brief explanation" }
5. Default to "culture:philosophy" for articles about life wisdom, personal growth, emotions, or human experiences
6. Default to "tech:data" for technical guides, tutorials, or programming-related content
7. Default to "business:markets" for content about money, wealth, income, or financial advice

Important: Be precise. Don't categorize something as "science" unless it's actually about scientific research.`

  const userPrompt = `Please categorize this article:

Title: ${titleToUse}

${summaryEnglish ? `Summary: ${summaryEnglish}` : ''}

${summaryChinese ? `Chinese Summary: ${summaryChinese}` : ''}

Return your answer in JSON format with "categories" array and "reasoning" string.`

  try {
    const response = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ])

    const { categories, reasoning } = parseAIResponse(response)

    // Validate categories
    const validCategoryIds = AVAILABLE_CATEGORIES.map(c => c.id)
    const validCategories = categories.filter(c => validCategoryIds.includes(c))

    // If no valid categories found, use default
    if (validCategories.length === 0) {
      return {
        primary: {
          main_category: 'culture',
          sub_category: 'philosophy',
          category_combined: 'culture:philosophy'
        },
        categories: ['culture:philosophy'],
        reasoning: 'Default classification - no valid categories found'
      }
    }

    // Get primary category details
    const primaryPattern = validCategories[0].split(':')
    const primary = {
      main_category: primaryPattern[0],
      sub_category: primaryPattern[1],
      category_combined: validCategories[0]
    }

    return {
      primary,
      categories: validCategories,
      reasoning: reasoning || `AI classified as: ${validCategories.join(', ')}`
    }
  } catch (error) {
    console.error('DeepSeek categorization error:', error)
    // Fallback to default
    return {
      primary: {
        main_category: 'culture',
        sub_category: 'philosophy',
        category_combined: 'culture:philosophy'
      },
      categories: ['culture:philosophy'],
      reasoning: 'Error - using default category'
    }
  }
}

/**
 * Categorize multiple articles in batch
 */
export async function categorizeBatch(
  articles: Array<{
    id: string
    title: string
    title_english: string | null
    summary_english: string | null
    summary_chinese: string | null
  }>,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{
  id: string
  result: MultiCategoryAssignment
}>> {
  const results: Array<{ id: string; result: MultiCategoryAssignment }> = []

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    const result = await categorizeWithDeepSeek(
      article.title,
      article.title_english,
      article.summary_english,
      article.summary_chinese
    )

    results.push({ id: article.id, result })

    // Rate limiting: wait a bit between requests
    if (i < articles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    onProgress?.(i + 1, articles.length)
  }

  return results
}

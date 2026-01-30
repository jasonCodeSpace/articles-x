/**
 * Editor Note Generation
 * Generates concise editor notes for high-quality articles (score ≥60)
 */

import { callDeepSeek } from './deepseek'

/**
 * Generate editor note for an article
 */
export async function generateEditorNote(
  title: string,
  summary: string,
  category: string
): Promise<string> {
  // If we have a summary, convert it to editor note
  // Otherwise, generate from title
  const contentToProcess = summary || title

  const prompt = `Convert this article summary into a concise editor note (50-100 words).

Requirements:
- Write in first-person plural ("we selected this because...", "this piece stands out because...")
- Focus on WHY it's worth reading, not what it says
- Mention the value/insight the reader will gain
- Keep it scannable - one or two short paragraphs
- No bullet points, just flowing text
- Professional but approachable tone

Category: ${category || 'General'}
${summary ? `Summary: ${summary}` : `Title: ${title}`}

Editor Note:`

  try {
    const note = await callDeepSeek(prompt, 500)
    return note.trim()
  } catch (error) {
    console.error('Failed to generate editor note:', error)
    // Fallback to generic note
    return generateFallbackNote(category)
  }
}

function generateFallbackNote(category: string): string {
  const fallbacks: Record<string, string> = {
    'ai': 'We selected this piece for its practical insights into AI development. The author shares actionable perspectives that go beyond the usual hype.',
    'bitcoin': 'This article stands out for its clear explanation of Bitcoin fundamentals. Worth reading for anyone looking to understand the technology.',
    'ethereum': 'We chose this piece for its technical depth on Ethereum. The author breaks down complex concepts in an accessible way.',
    'defi': 'This article offers valuable insights into DeFi protocols. A must-read for anyone navigating the decentralized finance landscape.',
    'trading': 'We selected this for its practical trading wisdom. The author shares real experience rather than theoretical advice.',
    'web3': 'This piece stands out for its balanced view on Web3 development. Worth reading for builders and enthusiasts alike.',
    'finance': 'We chose this article for its actionable financial advice. The author shares practical insights backed by real experience.',
    'business': 'This piece offers valuable business lessons. The author shares hard-won insights that founders can apply immediately.',
    'startup': 'We selected this for its honest take on startup life. A refreshing perspective that cuts through the usual founder mythology.',
    'markets': 'This article stands out for its market analysis. The author presents data-driven insights that help explain current trends.',
    'tech': 'We chose this piece for its deep technical exploration. The author breaks down complex concepts in an accessible way.',
    'security': 'This article offers important security insights. Worth reading for anyone concerned about digital safety.',
    'prediction': 'We selected this for its analysis of prediction markets. A unique perspective on an emerging trend.'
  }

  return fallbacks[category] || 'We selected this piece for its thoughtful analysis and practical insights. The author brings a unique perspective that adds value to the conversation.'
}

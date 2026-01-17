/**
 * Extract full article content from Twitter article result
 *
 * Twitter stores article content in content_state.blocks format
 * This module handles extracting that content as plain text
 */

interface ArticleResult {
  content_state?: {
    blocks?: Array<{ text?: string }>
  }
  content?: {
    blocks?: Array<{ text?: string }>
  }
  preview_text?: string
  description?: string
}

/**
 * Extract full article content from content_state.blocks
 * This is the structure Twitter uses for article content
 */
export function extractFullArticleContent(articleResult: ArticleResult): string {
  try {
    // First try content_state.blocks (the correct structure for X Articles)
    const contentState = articleResult?.content_state
    if (contentState?.blocks && Array.isArray(contentState.blocks)) {
      const textBlocks = contentState.blocks
        .filter((block: { text?: string }) => block.text && block.text.trim())
        .map((block: { text?: string }) => block.text!.trim())

      if (textBlocks.length > 0) {
        const fullContent = textBlocks.join('\n\n')
        console.log(`Extracted full article content: ${fullContent.length} characters`)
        return fullContent
      }
    }

    // Fallback to content.blocks (old structure)
    const content = articleResult?.content
    if (content?.blocks && Array.isArray(content.blocks)) {
      const textBlocks = content.blocks
        .filter((block: { text?: string }) => block.text && block.text.trim())
        .map((block: { text?: string }) => block.text!.trim())

      if (textBlocks.length > 0) {
        const fullContent = textBlocks.join('\n\n')
        console.log(`Extracted full article content (fallback): ${fullContent.length} characters`)
        return fullContent
      }
    }

    // Final fallback to preview text or description
    console.log('No blocks found, using preview text as fallback')
    return articleResult?.preview_text || articleResult?.description || ''
  } catch (error) {
    console.error('Error extracting full article content:', error)
    return articleResult?.preview_text || articleResult?.description || ''
  }
}

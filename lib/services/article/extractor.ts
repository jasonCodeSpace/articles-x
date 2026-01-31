/**
 * Extract all media URLs from article result
 * Returns arrays of image and video URLs
 */
export function extractMediaUrls(articleResult: ArticleResult): { images: string[], videos: string[] } {
  const images: string[] = []
  const videos: string[] = []
  const seenUrls = new Set<string>()

  const addUrl = (url: string, type: 'image' | 'video') => {
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url)
      if (type === 'image') {
        images.push(url)
      } else {
        videos.push(url)
      }
    }
  }

  // Process blocks from both content_state and content
  const contentState = articleResult?.content_state
  const content = articleResult?.content

  const processBlocks = (blocks: Block[]) => {
    for (const block of blocks) {
      // Extract from media array
      if (block.media && Array.isArray(block.media)) {
        for (const media of block.media) {
          const url = media.media_url_https || media.media_url || media.url || media.expanded_url
          const mediaType = media.type || ''

          if (mediaType.includes('video') || url?.includes('video')) {
            addUrl(url, 'video')
          } else {
            addUrl(url, 'image')
          }
        }
      }

      // Extract from entities.media
      if (block.entities?.media && Array.isArray(block.entities.media)) {
        for (const media of block.entities.media) {
          const url = media.media_url_https || media.media_url || media.url || media.expanded_url
          const mediaType = media.type || ''

          if (mediaType.includes('video') || url?.includes('video')) {
            addUrl(url, 'video')
          } else {
            addUrl(url, 'image')
          }
        }
      }

      // Extract from entities.urls (video URLs might be here)
      if (block.entities?.urls && Array.isArray(block.entities.urls)) {
        for (const urlObj of block.entities.urls) {
          const url = urlObj.expanded_url || urlObj.url
          if (url) {
            // Check if it's a video URL (YouTube, Vimeo, etc.)
            if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('video')) {
              addUrl(url, 'video')
            }
          }
        }
      }
    }
  }

  if (contentState?.blocks && Array.isArray(contentState.blocks)) {
    processBlocks(contentState.blocks)
  }

  if (content?.blocks && Array.isArray(content.blocks)) {
    processBlocks(content.blocks)
  }

  return { images, videos }
}

/**
 * Extract full article content from Twitter article result
 *
 * Twitter stores article content in content_state.blocks format
 * This module handles extracting that content as HTML with images preserved
 */

interface Media {
  type?: string
  media_url?: string
  media_url_https?: string
  url?: string
  expanded_url?: string
}

interface Block {
  text?: string
  media?: Media[]
  entities?: {
    media?: Media[]
    urls?: Array<{ url: string; expanded_url?: string }>
  }
}

interface ArticleResult {
  content_state?: {
    blocks?: Block[]
  }
  content?: {
    blocks?: Block[]
  }
  preview_text?: string
  description?: string
}

/**
 * Extract media URL from a block
 */
function extractMediaFromBlock(block: Block): string[] {
  const mediaUrls: string[] = []

  // Try media array directly
  if (block.media && Array.isArray(block.media)) {
    for (const media of block.media) {
      const url = media.media_url_https || media.media_url || media.url || media.expanded_url
      if (url) {
        mediaUrls.push(url)
      }
    }
  }

  // Try entities.media
  if (block.entities?.media && Array.isArray(block.entities.media)) {
    for (const media of block.entities.media) {
      const url = media.media_url_https || media.media_url || media.url || media.expanded_url
      if (url && !mediaUrls.includes(url)) {
        mediaUrls.push(url)
      }
    }
  }

  return mediaUrls
}

/**
 * Extract full article content from content_state.blocks
 * This is the structure Twitter uses for article content
 * Preserves images and other media in HTML format
 */
export function extractFullArticleContent(articleResult: ArticleResult): string {
  try {
    // First try content_state.blocks (the correct structure for X Articles)
    const contentState = articleResult?.content_state
    if (contentState?.blocks && Array.isArray(contentState.blocks)) {
      const contentParts: string[] = []

      for (const block of contentState.blocks) {
        const mediaUrls = extractMediaFromBlock(block)

        // Add text if present
        if (block.text && block.text.trim()) {
          contentParts.push(block.text.trim())
        }

        // Add media as HTML img tags
        for (const url of mediaUrls) {
          contentParts.push(`<img src="${url}" alt="Article image" />`)
        }
      }

      if (contentParts.length > 0) {
        const fullContent = contentParts.join('\n\n')
        console.log(`Extracted full article content: ${fullContent.length} characters`)
        return fullContent
      }
    }

    // Fallback to content.blocks (old structure)
    const content = articleResult?.content
    if (content?.blocks && Array.isArray(content.blocks)) {
      const contentParts: string[] = []

      for (const block of content.blocks) {
        const mediaUrls = extractMediaFromBlock(block)

        // Add text if present
        if (block.text && block.text.trim()) {
          contentParts.push(block.text.trim())
        }

        // Add media as HTML img tags
        for (const url of mediaUrls) {
          contentParts.push(`<img src="${url}" alt="Article image" />`)
        }
      }

      if (contentParts.length > 0) {
        const fullContent = contentParts.join('\n\n')
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

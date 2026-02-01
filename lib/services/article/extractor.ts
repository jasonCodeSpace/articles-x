/**
 * Extract all media URLs from article result
 * Supports both old and new Twitter/X article structures
 *
 * Old structure: block.media, block.entities.media
 * New structure: block.entityRanges + contentState.entityMap (with MEDIA type entities)
 */

interface EntityMediaItem {
  mediaId?: string
  url?: string
  mediaCategory?: string
}

interface EntityData {
  mediaItems?: EntityMediaItem[]
}

interface Entity {
  type?: string
  data?: EntityData
  value?: {
    type?: string
    data?: EntityData
  }
}

interface EntityRange {
  key: string
  offset: number
  length: number
}

interface ContentBlock {
  text?: string
  media?: Media[]
  entities?: {
    media?: Media[]
    urls?: Array<{ url: string; expanded_url?: string }>
  }
  entityRanges?: EntityRange[]
}

interface ContentState {
  blocks?: ContentBlock[]
  entityMap?: Record<string, Entity>
}

interface ArticleResultData {
  content_state?: ContentState
  content?: ContentState
  preview_text?: string
  description?: string
  cover_media?: {
    media_info?: {
      original_img_url?: string
    }
  }
}

export function extractMediaUrls(articleResult: ArticleResultData): { images: string[], videos: string[] } {
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

  const processBlocks = (blocks: ContentBlock[], entityMap?: Record<string, Entity>) => {
    for (const block of blocks) {
      // New structure: entityRanges + entityMap
      if (block.entityRanges && Array.isArray(block.entityRanges) && entityMap) {
        for (const range of block.entityRanges) {
          const entityKey = range.key
          const entity = entityMap[entityKey]

          // Handle both old structure (entity.type) and new structure (entity.value.type)
          const entityType = entity?.type || entity?.value?.type
          const entityData = entity?.data || entity?.value?.data

          if (entityType === 'MEDIA' && entityData?.mediaItems) {
            // This is a MEDIA entity - extract image URLs
            for (const item of entityData.mediaItems) {
              // Note: entityMap mediaId is an internal ID (e.g., "2016815983437168640")
              // that cannot be directly converted to a valid image URL
              // Valid image URLs use hash IDs (e.g., "G_0jmh9bUAQ82Ga")
              // We rely on cover_media for valid image URLs instead
              if (item.url) {
                addUrl(item.url, item.mediaCategory?.includes('video') ? 'video' : 'image')
              }
              // Skip item.mediaId as it's not a valid image URL
            }
          }
        }
      }

      // Old structure: media array
      if (block.media && Array.isArray(block.media)) {
        for (const media of block.media) {
          const url = media.media_url_https || media.media_url || media.url || media.expanded_url
          const mediaType = media.type || ''

          if (url) {
            if (mediaType.includes('video') || url.includes('video')) {
              addUrl(url, 'video')
            } else {
              addUrl(url, 'image')
            }
          }
        }
      }

      // Old structure: entities.media
      if (block.entities?.media && Array.isArray(block.entities.media)) {
        for (const media of block.entities.media) {
          const url = media.media_url_https || media.media_url || media.url || media.expanded_url
          const mediaType = media.type || ''

          if (url) {
            if (mediaType.includes('video') || url.includes('video')) {
              addUrl(url, 'video')
            } else {
              addUrl(url, 'image')
            }
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
    processBlocks(contentState.blocks, contentState.entityMap)
  }

  if (content?.blocks && Array.isArray(content.blocks)) {
    processBlocks(content.blocks, content.entityMap)
  }

  // Also check for cover_media
  if (articleResult?.cover_media?.media_info?.original_img_url) {
    addUrl(articleResult.cover_media.media_info.original_img_url, 'image')
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

// Re-export ContentBlock as Block for compatibility
type Block = ContentBlock

/**
 * Extract media URL from a block
 */
function extractMediaFromBlock(block: Block, entityMap?: Record<string, Entity>): string[] {
  const mediaUrls: string[] = []

  // New structure: entityRanges + entityMap
  if (block.entityRanges && Array.isArray(block.entityRanges) && entityMap) {
    for (const range of block.entityRanges) {
      const entity = entityMap[range.key]
      // Handle both old structure (entity.type) and new structure (entity.value.type)
      const entityType = entity?.type || entity?.value?.type
      const entityData = entity?.data || entity?.value?.data

      if (entityType === 'MEDIA' && entityData?.mediaItems) {
        for (const item of entityData.mediaItems) {
          if (item.mediaId) {
            mediaUrls.push(`https://pbs.twimg.com/media/${item.mediaId}`)
          } else if (item.url) {
            mediaUrls.push(item.url)
          }
        }
      }
    }
  }

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
export function extractFullArticleContent(articleResult: ArticleResultData): string {
  try {
    // Collect all media URLs from the article
    const allMediaUrls: string[] = []

    // First, add cover_media image if available (this is the main image)
    const coverImageUrl = articleResult?.cover_media?.media_info?.original_img_url
    if (coverImageUrl) {
      allMediaUrls.push(coverImageUrl)
    }

    // Extract media from entityMap
    const contentState = articleResult?.content_state
    if (contentState?.entityMap) {
      const mediaUrls = extractMediaUrls(articleResult)
      allMediaUrls.push(...mediaUrls.images)
    }

    // First try content_state.blocks (the correct structure for X Articles)
    if (contentState?.blocks && Array.isArray(contentState.blocks)) {
      const contentParts: string[] = []
      let mediaIndex = 0

      for (const block of contentState.blocks) {
        // Check if this block has media entity
        const hasMedia = block.entityRanges && block.entityRanges.some((range: EntityRange) => {
          const entity = contentState.entityMap?.[range.key]
          const entityType = entity?.type || entity?.value?.type
          return entityType === 'MEDIA'
        })

        // Add text if present
        if (block.text && block.text.trim()) {
          contentParts.push(block.text.trim())

          // If this block has a media entity, add the image after the text
          if (hasMedia && mediaIndex < allMediaUrls.length) {
            const imgUrl = allMediaUrls[mediaIndex]
            // Only add if not already added from cover_media
            if (!contentParts.some(p => p.includes(imgUrl))) {
              contentParts.push(`<img src="${imgUrl}" alt="Article image" />`)
            }
            mediaIndex++
          }
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
        const mediaUrls = extractMediaFromBlock(block, content.entityMap)

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

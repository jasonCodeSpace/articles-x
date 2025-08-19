#!/usr/bin/env tsx

import { mapTweetToArticle } from '../lib/ingest'
import { TwitterTweet } from '../lib/twitter'

// Sample tweet data with cover_media structure
const sampleTweetWithCoverImage: TwitterTweet = {
  id_str: '1234567890',
  rest_id: '1234567890',
  full_text: 'Check out this article about PumpFun!',
  created_at: 'Wed Oct 25 20:30:15 +0000 2023',
  core: {
    user_results: {
      result: {
        legacy: {
          id_str: 'user123',
          screen_name: 'testuser',
          name: 'Test User',
          profile_image_url_https: 'https://pbs.twimg.com/profile_images/test.jpg'
        }
      }
    }
  },
  article_results: {
    result: {
      rest_id: 'article123',
      title: 'PumpFun is winning.',
      preview_text: 'This is a preview of the article about PumpFun.',
      description: 'Article description here',
      url: 'https://example.com/article',
      cover_media: {
        media_info: {
          original_img_url: 'https://pbs.twimg.com/media/GxXN2RLWcAAmv-A.jpg'
        }
      }
    }
  }
}

// Test the mapping function
console.log('Testing cover image extraction...')
const result = mapTweetToArticle(sampleTweetWithCoverImage)

if (result) {
  console.log('✅ Successfully mapped tweet to article:')
  console.log('Title:', result.title)
  console.log('Featured Image URL:', result.featured_image_url)
  console.log('Article URL:', result.article_url)
  console.log('Author:', result.author_name, `(@${result.author_handle})`)
  
  if (result.featured_image_url) {
    console.log('\n🎉 Cover image URL extracted successfully!')
    console.log('Image URL:', result.featured_image_url)
  } else {
    console.log('\n❌ No cover image URL found')
  }
} else {
  console.log('❌ Failed to map tweet to article')
}
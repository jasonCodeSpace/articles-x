import { describe, test, expect } from '@jest/globals'
import { mapTweetToArticle, harvestedToDatabase } from '@/lib/ingest'
import { TwitterTweet } from '@/lib/twitter'
import sampleResponse from './sample-twitter-response.json'

describe('Article Ingest System', () => {
  describe('mapTweetToArticle', () => {
    test('should map tweet with explicit URL', () => {
      const tweet: TwitterTweet = {
        id_str: '1234567890',
        full_text: 'Check out this amazing article about the future of AI!',
        created_at: 'Wed Oct 05 21:25:35 +0000 2023',
        user: {
          id_str: '987654321',
          screen_name: 'tech_writer',
          name: 'Tech Writer Pro',
        },
        article_results: {
          result: {
            rest_id: 'article123456',
            title: 'The Future of AI: How Machine Learning Will Transform Industries',
            description: 'An in-depth look at the revolutionary impact of artificial intelligence.',
            url: 'https://example.com/articles/future-of-ai',
          },
        },
      }

      const result = mapTweetToArticle(tweet)

      expect(result).toEqual({
        article_url: 'https://example.com/articles/future-of-ai',
        title: 'The Future of AI: How Machine Learning Will Transform Industries',
        excerpt: 'An in-depth look at the revolutionary impact of artificial intelligence.',
        author_name: 'Tech Writer Pro',
        author_handle: 'tech_writer',
        author_profile_image: undefined,
        tweet_id: '1234567890',
        rest_id: 'article123456',
        original_url: 'https://example.com/articles/future-of-ai',
        created_at: 'Wed Oct 05 21:25:35 +0000 2023',
      })
    })

    test('should map tweet with rest_id but no explicit URL', () => {
      const tweet: TwitterTweet = {
        id_str: '2345678901',
        full_text: 'Just published my thoughts on sustainable technology practices.',
        created_at: 'Thu Oct 06 14:30:22 +0000 2023',
        user: {
          id_str: '876543210',
          screen_name: 'green_tech_guru',
          name: 'Sarah Green',
        },
        article_results: {
          result: {
            rest_id: 'article789012',
            title: 'Sustainable Technology: Building a Greener Digital Future',
            description: 'Explore how technology companies are adopting sustainable practices.',
          },
        },
      }

      const result = mapTweetToArticle(tweet)

      expect(result).toEqual({
        article_url: 'https://x.com/green_tech_guru/status/2345678901',
        title: 'Sustainable Technology: Building a Greener Digital Future',
        excerpt: 'Explore how technology companies are adopting sustainable practices.',
        author_name: 'Sarah Green',
        author_handle: 'green_tech_guru',
        tweet_id: '2345678901',
        rest_id: 'article789012',
        original_url: undefined,
        created_at: 'Thu Oct 06 14:30:22 +0000 2023',
      })
    })

    test('should map tweet with neither URL nor rest_id (fallback to post URL)', () => {
      const tweet: TwitterTweet = {
        id_str: '3456789012',
        full_text: 'New research findings on quantum computing are absolutely fascinating!',
        created_at: 'Fri Oct 07 09:15:44 +0000 2023',
        user: {
          id_str: '765432109',
          screen_name: 'quantum_researcher',
          name: 'Dr. Quantum',
        },
        article_results: {
          result: {},
        },
      }

      const result = mapTweetToArticle(tweet)

      expect(result).toEqual({
        article_url: 'https://x.com/quantum_researcher/status/3456789012',
        title: 'New research findings on quantum computing are absolutely fascinating!',
        excerpt: 'New research findings on quantum computing are absolutely fascinating!',
        author_name: 'Dr. Quantum',
        author_handle: 'quantum_researcher',
        author_profile_image: undefined,
        tweet_id: '3456789012',
        rest_id: undefined,
        original_url: undefined,
        created_at: 'Fri Oct 07 09:15:44 +0000 2023',
      })
    })

    test('should return null for tweet without article_results', () => {
      const tweet: TwitterTweet = {
        id_str: '4567890123',
        full_text: 'Regular tweet without article content',
        created_at: 'Sat Oct 08 16:45:12 +0000 2023',
        user: {
          id_str: '654321098',
          screen_name: 'regular_user',
          name: 'John Doe',
        },
      }

      const result = mapTweetToArticle(tweet)

      expect(result).toBeNull()
    })

    test('should handle missing user data gracefully', () => {
      const tweet: TwitterTweet = {
        id_str: '5678901234',
        full_text: 'Tweet with missing user data',
        created_at: 'Sun Oct 09 12:00:00 +0000 2023',
        article_results: {
          result: {
            rest_id: 'article567890',
            title: 'Test Article',
          },
        },
      }

      const result = mapTweetToArticle(tweet)

      expect(result).toBeNull() // Should return null due to missing author handle
    })
  })

  describe('harvestedToDatabase', () => {
    test('should convert harvested article to database format', () => {
      const harvestedArticle = {
        article_url: 'https://example.com/articles/future-of-ai',
        title: 'The Future of AI: How Machine Learning Will Transform Industries',
        excerpt: 'An in-depth look at the revolutionary impact of artificial intelligence.',
        author_name: 'Tech Writer Pro',
        author_handle: 'tech_writer',
        tweet_id: '1234567890',
        rest_id: 'article123456',
        original_url: 'https://example.com/articles/future-of-ai',
        created_at: 'Wed Oct 05 21:25:35 +0000 2023',
      }

      const result = harvestedToDatabase(harvestedArticle)

      expect(result).toEqual({
        title: 'The Future of AI: How Machine Learning Will Transform Industries',
        slug: 'the-future-of-ai-how-machine-learning-will-transform-industries',
        content: 'An in-depth look at the revolutionary impact of artificial intelligence.',
        excerpt: 'An in-depth look at the revolutionary impact of artificial intelligence.',
        author_name: 'Tech Writer Pro',
        author_handle: 'tech_writer',
        author_profile_image: undefined,
        status: 'published',
        published_at: '2023-10-05T21:25:35.000Z',
        meta_title: 'The Future of AI: How Machine Learning Will Transform Industries',
        meta_description: 'An in-depth look at the revolutionary impact of artificial intelligence.',
        tags: ['twitter', 'imported'],
        category: 'twitter-import',
      })
    })

    test('should generate slug from title correctly', () => {
      const harvestedArticle = {
        article_url: 'https://example.com/test',
        title: 'Hello, World! This is a Test Article (2023)',
        author_name: 'Test Author',
        author_handle: 'test_author',
        tweet_id: '1234567890',
        created_at: 'Wed Oct 05 21:25:35 +0000 2023',
      }

      const result = harvestedToDatabase(harvestedArticle)

      expect(result.slug).toBe('hello-world-this-is-a-test-article-2023')
    })

    test('should handle article without excerpt', () => {
      const harvestedArticle = {
        article_url: 'https://example.com/no-excerpt',
        title: 'Article Without Excerpt',
        author_name: 'Author Name',
        author_handle: 'author_handle',
        tweet_id: '1234567890',
        created_at: 'Wed Oct 05 21:25:35 +0000 2023',
      }

      const result = harvestedToDatabase(harvestedArticle)

      expect(result.excerpt).toBe('Article by Author Name')
      expect(result.content).toBe('Article Without Excerpt')
      expect(result.meta_description).toBe('Article by Author Name')
    })
  })

  describe('Sample Twitter Response Processing', () => {
    test('should extract correct number of articles from sample response', () => {
      // This test demonstrates how the sample response would be processed
      const instructions = sampleResponse.data.list.tweets_timeline.timeline.instructions

      let articleCount = 0
      for (const instruction of instructions) {
        if (instruction.type === 'TimelineAddEntries') {
          for (const entry of instruction.entries) {
            if (entry.content.entryType === 'TimelineTimelineItem' && 
                entry.content.itemContent?.itemType === 'TimelineTweet') {
              const tweet = entry.content.itemContent.tweet_results?.result
              if (tweet?.article_results) {
                articleCount++
              }
            }
          }
        }
      }

      expect(articleCount).toBe(3) // Three tweets have article_results in the sample
    })

    test('should extract cursor from sample response', () => {
      const instructions = sampleResponse.data.list.tweets_timeline.timeline.instructions

      let cursor: string | undefined
      for (const instruction of instructions) {
        if (instruction.type === 'TimelineAddEntries') {
          for (const entry of instruction.entries) {
            if (entry.content.entryType === 'TimelineTimelineCursor' && 
                entry.content.cursorType === 'Bottom') {
              cursor = entry.content.value
            }
          }
        }
      }

      expect(cursor).toBe('DAACDAABCgABF_-W-KEKAAIXz5Ps6AoAAhctntG6Cg')
    })
  })
})
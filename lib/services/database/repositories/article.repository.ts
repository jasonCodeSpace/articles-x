import { createServiceRoleClient } from '../client'
import type { DatabaseArticle, BatchResult } from '../../article/types'

/**
 * Article Repository
 * Handles all database operations for articles
 */
export class ArticleRepository {
  private client = createServiceRoleClient()

  /**
   * Check if an article exists by title and URL
   */
  async findByTitleAndUrl(title: string, articleUrl: string): Promise<{ id: string; updated_at: string } | null> {
    const { data, error } = await this.client
      .from('articles')
      .select('id, updated_at')
      .eq('title', title)
      .eq('article_url', articleUrl || '')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error(`Error checking existing article:`, error)
      return null
    }

    return data
  }

  /**
   * Insert a new article
   */
  async insert(article: DatabaseArticle): Promise<boolean> {
    const { error } = await this.client
      .from('articles')
      .insert([article])

    if (error) {
      if (error.code === '23505' && error.message?.includes('articles_title_url_unique')) {
        console.log(`Skipped duplicate article: ${article.title}`)
        return false
      }
      console.error(`Error inserting article ${article.article_url}:`, error)
      return false
    }

    console.log(`Inserted article: ${article.title}`)
    return true
  }

  /**
   * Update an existing article
   */
  async update(id: string, article: DatabaseArticle): Promise<boolean> {
    const { error } = await this.client
      .from('articles')
      .update({
        title: article.title,
        full_article_content: article.full_article_content,
        author_name: article.author_name,
        author_handle: article.author_handle,
        author_avatar: article.author_avatar,
        image: article.image,
        tweet_published_at: article.tweet_published_at,
        tweet_id: article.tweet_id,
        tweet_text: article.tweet_text,
        tweet_views: article.tweet_views,
        tweet_replies: article.tweet_replies,
        tweet_likes: article.tweet_likes,
        article_published_at: article.article_published_at,
        article_url: article.article_url,
      })
      .eq('id', id)

    if (error) {
      console.error(`Error updating article ${article.article_url}:`, error)
      return false
    }

    console.log(`Updated article: ${article.title}`)
    return true
  }

  /**
   * Batch upsert articles
   */
  async batchUpsert(articles: DatabaseArticle[], dryRun = false): Promise<BatchResult> {
    const result: BatchResult = { inserted: 0, updated: 0, skipped: 0 }

    if (articles.length === 0) {
      return result
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would process ${articles.length} articles`)
      return { inserted: articles.length, updated: 0, skipped: 0 }
    }

    // Process in batches of 10
    const batchSize = 10

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articles.length / batchSize)}`)

      for (const article of batch) {
        const existing = await this.findByTitleAndUrl(article.title, article.article_url || '')

        if (existing) {
          const success = await this.update(existing.id, article)
          if (success) {
            result.updated++
          } else {
            result.skipped++
          }
        } else {
          const success = await this.insert(article)
          if (success) {
            result.inserted++
          } else {
            result.skipped++
          }
        }
      }

      // Small delay between batches
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`Batch upsert completed: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`)
    return result
  }
}

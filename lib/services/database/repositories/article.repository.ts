import { createServiceRoleClient } from '../client'
import type { DatabaseArticle, BatchResult } from '../../article/types'
import { calculateArticleScore, meetsMinimumWordCount, shouldIndexArticle } from '@/lib/article-score'
import { CATEGORIES, ALL_SUBCATEGORIES } from '@/lib/categories'

/**
 * Get category ID from article content (simple keyword matching)
 */
function detectCategoryFromContent(title: string, content: string): { mainCategory: string | undefined, subcategory: string | undefined } {
  const combinedText = `${title} ${content}`.toLowerCase()

  // Check for subcategory matches first
  for (const sub of ALL_SUBCATEGORIES) {
    if (combinedText.includes(sub.name.toLowerCase()) || combinedText.includes(sub.id.toLowerCase())) {
      const mainCat = CATEGORIES.find(c => c.id === sub.mainCategory)
      return { mainCategory: mainCat?.id, subcategory: sub.id }
    }
  }

  // If no subcategory match, try main category
  for (const cat of CATEGORIES) {
    if (combinedText.includes(cat.name.toLowerCase()) || combinedText.includes(cat.id.toLowerCase())) {
      return { mainCategory: cat.id, subcategory: cat.subcategories[0]?.id }
    }
  }

  return { mainCategory: undefined, subcategory: undefined }
}

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
    // Auto-detect categories if not provided
    let mainCategory = article.main_category
    let subcategory = article.subcategory

    if (!mainCategory || !subcategory) {
      const detected = detectCategoryFromContent(article.title, article.full_article_content || '')
      mainCategory = article.main_category || detected.mainCategory
      subcategory = article.subcategory || detected.subcategory
    }

    const { error } = await this.client
      .from('articles')
      .insert([{
        title: article.title,
        slug: article.slug,
        full_article_content: article.full_article_content,
        author_name: article.author_name,
        author_handle: article.author_handle,
        author_avatar: article.author_avatar,
        image: article.image,
        category: article.category,
        main_category: mainCategory,
        sub_category: subcategory,
        tweet_published_at: article.tweet_published_at,
        tweet_id: article.tweet_id,
        tweet_text: article.tweet_text,
        tweet_views: article.tweet_views,
        tweet_replies: article.tweet_replies,
        tweet_likes: article.tweet_likes,
        article_published_at: article.article_published_at,
        article_url: article.article_url,
        article_images: article.article_images || [],
        article_videos: article.article_videos || [],
        indexed: article.indexed ?? false,
        score: article.score ?? 0,
      }])

    if (error) {
      if (error.code === '23505' && error.message?.includes('articles_title_url_unique')) {
        console.log(`Skipped duplicate article: ${article.title}`)
        return false
      }
      console.error(`Error inserting article ${article.article_url}:`, error)
      return false
    }

    console.log(`Inserted article: ${article.title} (score: ${article.score}, indexed: ${article.indexed})`)
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
        article_images: article.article_images || [],
        article_videos: article.article_videos || [],
        indexed: article.indexed ?? false,
        score: article.score ?? 0,
      })
      .eq('id', id)

    if (error) {
      console.error(`Error updating article ${article.article_url}:`, error)
      return false
    }

    console.log(`Updated article: ${article.title} (score: ${article.score}, indexed: ${article.indexed})`)
    return true
  }

  /**
   * Batch upsert articles
   */
  async batchUpsert(articles: DatabaseArticle[], dryRun = false): Promise<BatchResult> {
    const result: BatchResult = { inserted: 0, updated: 0, skipped: 0, deleted: 0 }

    if (articles.length === 0) {
      return result
    }

    // Filter out articles with insufficient word count first
    const validArticles = []
    const deletedArticles = []

    for (const article of articles) {
      if (meetsMinimumWordCount(article.full_article_content || '')) {
        validArticles.push(article)
      } else {
        deletedArticles.push(article)
        result.deleted++
        console.log(`Skipped article (too short): ${article.title} (${article.full_article_content?.length || 0} chars)`)
      }
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would process ${validArticles.length} valid articles, skip ${deletedArticles.length} too short articles`)
      return {
        inserted: validArticles.length,
        updated: 0,
        skipped: 0,
        deleted: deletedArticles.length
      }
    }

    // Process in batches of 10
    const batchSize = 10

    for (let i = 0; i < validArticles.length; i += batchSize) {
      const batch = validArticles.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validArticles.length / batchSize)}`)

      for (const article of batch) {
        const existing = await this.findByTitleAndUrl(article.title, article.article_url || '')

        // Calculate article score
        const score = calculateArticleScore({
          tweet_views: article.tweet_views,
          tweet_likes: article.tweet_likes,
          tweet_replies: article.tweet_replies,
          full_article_content: article.full_article_content
        })

        // Determine if article should be indexed
        const indexed = shouldIndexArticle(score)

        if (existing) {
          const success = await this.update(existing.id, {
            ...article,
            score,
            indexed
          })
          if (success) {
            result.updated++
          } else {
            result.skipped++
          }
        } else {
          const success = await this.insert({
            ...article,
            score,
            indexed
          })
          if (success) {
            result.inserted++
          } else {
            result.skipped++
          }
        }
      }

      // Small delay between batches
      if (i + batchSize < validArticles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`Batch upsert completed: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped, ${result.deleted} deleted (too short)`)
    return result
  }
}

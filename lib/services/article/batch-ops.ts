import type { HarvestedArticle } from './types'
import { harvestedToDatabase } from './mapper'
import { ArticleRepository } from '../database'

/**
 * Batch upsert articles to the database
 */
export async function batchUpsertArticles(
  harvestedArticles: HarvestedArticle[],
  dryRun = false
): Promise<{ inserted: number; updated: number; skipped: number }> {
  if (harvestedArticles.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0 }
  }

  // Group by article_url to handle duplicates
  const uniqueArticles = new Map<string, HarvestedArticle>()
  for (const article of harvestedArticles) {
    uniqueArticles.set(article.article_url, article)
  }

  console.log(`Processing ${uniqueArticles.size} unique articles (${harvestedArticles.length} total harvested)`)

  if (dryRun) {
    console.log('DRY RUN: Would process these articles:')
    for (const [url, article] of uniqueArticles) {
      console.log(`  - ${article.title} (${url})`)
    }
    return { inserted: uniqueArticles.size, updated: 0, skipped: 0 }
  }

  // Convert to database format
  const dbArticles: ReturnType<typeof harvestedToDatabase>[] = []
  for (const article of uniqueArticles.values()) {
    dbArticles.push(harvestedToDatabase(article))
  }

  // Use repository for batch upsert
  const repository = new ArticleRepository()
  return repository.batchUpsert(dbArticles, dryRun)
}

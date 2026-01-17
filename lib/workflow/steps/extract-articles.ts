/**
 * Step 2: 从推文中提取文章
 */
import { createStep, StepResult, WorkflowContext } from '../engine'
import { TwitterTweet, createTwitterClient } from '@/lib/services/twitter'
import { mapTweetToArticle, HarvestedArticle } from '@/lib/services/article'

export interface ExtractArticlesInput {
  tweets: TwitterTweet[]
  listIds: string[]
  totalTweets: number
}

export interface ExtractArticlesOutput {
  articles: HarvestedArticle[]
  totalTweets: number
  articlesFound: number
}

// Function to check if a tweet MIGHT be an article from the list view
function _isPotentialArticle(tweet: TwitterTweet): boolean {
  // Check for article_results or if it looks like a long form post that might be an article
  // Some articles in list view show up with 'article' field
  return !!(tweet.article_results?.result || tweet.article?.article_results?.result || tweet.legacy?.full_text?.includes('https://t.co/'));
  // Note: The user said "fetch the list... For every item found... fetch the specific Tweet Detail".
  // This could mean fetch EVERYTHING. But that would be expensive.
  // "For every item found, use the tweet_id... to make a separate API call... to fetch... Full Article JSON" implies we only care about Actual Articles.
  // If we fetch every tweet detail, we waste API calls on normal tweets.
  // However, "data integrity issues... zero metrics" implies we need metrics for the tweets that ARE articles.
  // So we filter for things that look like articles.
  // Let's stick to: if it has article content OR if it's a candidate.
  // To be safe and since I can't easily know if a link is an Article without checking, I will trust the 'article' field existence if possible.
  // If the list view doesn't return 'article' object for articles, we have a problem.
  // Assuming list view returns minimal info.
  // Better heuristic: checks if it has 'article' or 'article_results' structure.
}

export const extractArticlesStep = createStep<ExtractArticlesInput, ExtractArticlesOutput>(
  'extract-articles',
  async (input: ExtractArticlesInput, ctx: WorkflowContext): Promise<StepResult<ExtractArticlesOutput>> => {
    try {
      const { tweets } = input
      const articles: HarvestedArticle[] = []
      const client = createTwitterClient()

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'extract-articles',
        message: `Processing ${tweets.length} tweets for articles...`
      })

      // We only want to deep fetch things that are actually articles or we suspect are articles.
      // But user said "The goal is to aggregate X Articles".
      // So we filter first.
      
      const potentialArticles = tweets.filter(t => 
        t.article_results?.result || 
        t.article?.article_results?.result ||
        // Also check if it's an article by URL entities maybe? But X Articles usually have the article object.
        // Let's trust the presence of article object or simply try to map it first.
        // If mapTweetToArticle returns something (even with missing content), we deep fetch it to fix it.
        // Wait, mapTweetToArticle currently builds from list view. 
        // Let's assume any tweet with 'article' field is a candidate.
        (t.article || t.article_results)
      );

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'extract-articles',
        message: `Found ${potentialArticles.length} potential articles to deep fetch`
      })

      // Deep fetch each potential article
      for (let i = 0; i < potentialArticles.length; i++) {
         const tweet = potentialArticles[i];
         const tweetId = tweet.legacy?.id_str || tweet.rest_id;
         
         if (!tweetId) continue;

         try {
            // Stage 2: Deep Fetch
            // Fetch the specific Tweet Detail
            const fullTweet = await client.fetchTweet(tweetId);
            
            if (fullTweet) {
              const article = mapTweetToArticle(fullTweet);
              if (article) {
                articles.push(article);
              }
            }
            
            // Add slight delay to be nice to API even with queue
            await new Promise(resolve => setTimeout(resolve, 500));
            
         } catch (error) {
            ctx.logs.push({
              timestamp: new Date(),
              level: 'warn',
              step: 'extract-articles',
              message: `Failed to deep fetch tweet ${tweetId}: ${error}`
            });
         }
      }

      ctx.logs.push({
        timestamp: new Date(),
        level: 'info',
        step: 'extract-articles',
        message: `Extracted ${articles.length} fully fetched articles`
      })

      if (articles.length === 0) {
        return {
          success: true,
          skip: true,
          message: 'No articles found after deep fetching'
        }
      }

      return {
        success: true,
        data: {
          articles,
          totalTweets: tweets.length,
          articlesFound: articles.length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to extract articles from tweets'
      }
    }
  }
)

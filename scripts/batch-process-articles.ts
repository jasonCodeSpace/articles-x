import fs from 'fs';
import path from 'path';
import { createServiceClient } from '../lib/supabase/service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
import type { TweetLink } from './process-tweet-links';

interface ProcessedArticle {
  id?: string;
  title: string;
  slug: string;
  author_name: string;
  image?: string;
  author_handle: string;
  author_avatar?: string;
  article_published_at: string;
  article_url: string;
  updated_at: string;
  category: string;
  tweet_id: string;
  tweet_text: string;
  tweet_published_at: string;
  tweet_views?: number;
  tweet_replies?: number;
  tweet_retweets?: number;
  tweet_likes?: number;
  tweet_bookmarks?: number;
  article_preview_text?: string;
  full_article_content?: string;
}

/**
 * Fetch tweet details from the process-articles API
 * @param tweetId - The tweet ID to fetch
 * @returns Promise with the processed article data
 */
async function fetchTweetDetails(tweetId: string): Promise<ProcessedArticle | null> {
  try {
    // Use the process-articles API which has better error handling
    const response = await fetch(`http://localhost:3002/api/process-articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ tweetIds: [tweetId] })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch tweet ${tweetId}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Insert articles into Supabase database
 * @param articles - Array of processed articles
 * @returns Promise with insertion results
 */
async function insertArticles(articles: ProcessedArticle[]): Promise<void> {
  const supabase = createServiceClient();
  
  // Insert articles in batches of 50 to avoid overwhelming the database
  const batchSize = 50;
  
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('articles')
        .upsert(batch, { 
          onConflict: 'tweet_id',
          ignoreDuplicates: false 
        })
        .select('id, title, tweet_id');
      
      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      } else {
        console.log(`Successfully inserted batch ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} articles`);
      }
    } catch (error) {
      console.error(`Exception inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
    }
    
    // Add a small delay between batches to be gentle on the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Main function to process all tweet links
 */
async function main() {
  const extractedDataPath = path.join(process.cwd(), 'extracted-tweet-ids.json');
  
  if (!fs.existsSync(extractedDataPath)) {
    console.error('extracted-tweet-ids.json not found. Please run process-tweet-links.ts first.');
    return;
  }
  
  const tweetLinks: TweetLink[] = JSON.parse(fs.readFileSync(extractedDataPath, 'utf-8'));
  
  console.log(`Processing ${tweetLinks.length} tweets...`);
  
  const processedArticles: ProcessedArticle[] = [];
  const failedTweets: string[] = [];
  
  // Process tweets in batches to avoid overwhelming the API
  const batchSize = 10;
  
  for (let i = 0; i < tweetLinks.length; i += batchSize) {
    const batch = tweetLinks.slice(i, i + batchSize);
    
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tweetLinks.length / batchSize)}...`);
    
    const batchPromises = batch.map(async (tweetLink) => {
      const article = await fetchTweetDetails(tweetLink.tweetId);
      if (article) {
        processedArticles.push(article);
      } else {
        failedTweets.push(tweetLink.tweetId);
      }
    });
    
    await Promise.all(batchPromises);
    
    // Add delay between batches
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\nProcessing complete:`);
  console.log(`- Successfully processed: ${processedArticles.length} articles`);
  console.log(`- Failed: ${failedTweets.length} tweets`);
  
  if (failedTweets.length > 0) {
    console.log('Failed tweet IDs:', failedTweets.slice(0, 10).join(', '), failedTweets.length > 10 ? '...' : '');
  }
  
  if (processedArticles.length > 0) {
    console.log('\nInserting articles into Supabase...');
    await insertArticles(processedArticles);
    
    // Save processed data for verification
    const outputPath = path.join(process.cwd(), 'processed-articles.json');
    fs.writeFileSync(outputPath, JSON.stringify(processedArticles, null, 2));
    console.log(`Processed articles saved to: ${outputPath}`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { fetchTweetDetails, insertArticles };
export type { ProcessedArticle };
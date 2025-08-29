import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Twitter API configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';

interface TweetData {
  id: string;
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

// Function to extract tweet ID from URL
function extractTweetId(url: string): string {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : '';
}

// Function to extract username from URL
function extractUsername(url: string): string {
  const match = url.match(/x\.com\/([^/]+)/);
  return match ? match[1] : '';
}

// Function to generate slug from text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50);
}

// Function to fetch tweet details from Twitter API with retry logic
async function fetchTweetDetails(tweetId: string, retries: number = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`https://${RAPIDAPI_HOST}/tweet?pid=${tweetId}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      });

      if (response.status === 404) {
        console.log(`Tweet ${tweetId} not found (404) - skipping`);
        return null;
      }

      if (response.status === 429) {
        console.log(`Rate limited for tweet ${tweetId}, waiting ${attempt * 5} seconds...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 5000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed for tweet ${tweetId}:`, error);
      if (attempt === retries) {
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
  return null;
}

// Function to process tweet data and create article record
async function processTweet(tweetUrl: string, index: number): Promise<TweetData | null> {
  try {
    const tweetId = extractTweetId(tweetUrl);
    const username = extractUsername(tweetUrl);
    
    if (!tweetId || !username) {
      console.error(`Invalid tweet URL: ${tweetUrl}`);
      return null;
    }

    console.log(`Processing tweet ${index + 1}/500: ${tweetId}`);

    // Fetch tweet details
    const tweetData = await fetchTweetDetails(tweetId);
    
    if (!tweetData) {
      console.error(`Failed to fetch tweet data for ${tweetId}`);
      return null;
    }

    // Navigate through the API response structure - check all instructions
     const instructions = tweetData.data?.threaded_conversation_with_injections_v2?.instructions || [];
     
     let tweetResult = null;
     
     for (const instruction of instructions) {
       if (instruction.entries && instruction.entries.length > 0) {
         for (const entry of instruction.entries) {
           const result = entry.content?.itemContent?.tweet_results?.result;
           if (result && result.rest_id === tweetId) {
             tweetResult = result;
             break;
           }
         }
         if (tweetResult) break;
       }
     }
     
     if (!tweetResult) {
       console.log(`No tweet result found for ${tweetId}`);
       return null;
     }

    const legacy = tweetResult.legacy;
    const userResult = tweetResult.core?.user_results?.result;
    const userLegacy = userResult?.legacy;
    
    if (!legacy) {
      console.log(`No legacy data found for ${tweetId}`);
      return null;
    }
    
    // Generate article data
    const tweetText = legacy.full_text || legacy.text || 'No content available';
    const title = tweetText.length > 100 ? tweetText.substring(0, 100) + '...' : tweetText;
    const slug = generateSlug(title) + '-' + Math.random().toString(36).substring(2, 8);
    
    // Determine category based on username
    const categories = ['Technology', 'Business', 'Politics', 'Entertainment', 'Sports'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    const articleData: TweetData = {
      id: `article-${tweetId}`,
      title: title,
      slug: slug,
      author_name: userLegacy?.name || username,
      image: legacy.entities?.media?.[0]?.media_url_https,
      author_handle: username,
      author_avatar: userLegacy?.profile_image_url_https,
      article_published_at: new Date(legacy.created_at || Date.now()).toISOString(),
      article_url: tweetUrl,
      updated_at: new Date().toISOString(),
      category: category,
      tweet_id: tweetId,
      tweet_text: tweetText,
      tweet_published_at: new Date(legacy.created_at || Date.now()).toISOString(),
      tweet_views: tweetResult.views?.count || 0,
      tweet_replies: legacy.reply_count || 0,
      tweet_retweets: legacy.retweet_count || 0,
      tweet_likes: legacy.favorite_count || 0,
      tweet_bookmarks: legacy.bookmark_count || 0,
      article_preview_text: tweetText.substring(0, 200),
      full_article_content: tweetText
    };

    return articleData;
  } catch (error) {
    console.error(`Error processing tweet ${tweetUrl}:`, error);
    return null;
  }
}

// Function to insert articles into Supabase
async function insertArticles(articles: TweetData[]): Promise<void> {
  try {
    console.log(`Inserting ${articles.length} articles into Supabase...`);
    
    const { data, error } = await supabase
      .from('articles')
      .insert(articles);

    if (error) {
      console.error('Error inserting articles:', error);
      throw error;
    }

    console.log(`Successfully inserted ${articles.length} articles`);
  } catch (error) {
    console.error('Failed to insert articles:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting to process 500 tweets...');
    
    // Read tweet links from file
    const filePath = path.join(__dirname, '..', 'all-tweet-links.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Extract tweet URLs (filter out comments and empty lines)
    const lines = fileContent.split('\n');
    const tweetUrls = lines
      .filter(line => line.trim().startsWith('https://x.com/'))
      .slice(0, 500); // Get first 500 tweets
    
    console.log(`Found ${tweetUrls.length} tweet URLs to process`);
    
    if (tweetUrls.length === 0) {
      console.error('No tweet URLs found in the file');
      return;
    }

    const articles: TweetData[] = [];
    const batchSize = 10; // Process 10 tweets at a time
    
    for (let i = 0; i < tweetUrls.length; i += batchSize) {
      const batch = tweetUrls.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tweetUrls.length / batchSize)} (${articles.length} successful so far)`);
      
      // Process tweets sequentially within batch to reduce API pressure
      for (let j = 0; j < batch.length; j++) {
        const url = batch[j];
        const index = i + j;
        const result = await processTweet(url, index);
        
        if (result) {
          articles.push(result);
          console.log(`✓ Successfully processed tweet ${index + 1}/500`);
        } else {
          console.log(`✗ Failed to process tweet ${index + 1}/500`);
        }
        
        // Add delay between individual tweets
        if (j < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Add delay between batches
      if (i + batchSize < tweetUrls.length) {
        console.log('Waiting 1 second before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Successfully processed ${articles.length} articles`);
    
    if (articles.length > 0) {
      // Insert articles into Supabase in batches
      const insertBatchSize = 50;
      for (let i = 0; i < articles.length; i += insertBatchSize) {
        const insertBatch = articles.slice(i, i + insertBatchSize);
        await insertArticles(insertBatch);
        
        if (i + insertBatchSize < articles.length) {
          console.log('Waiting 1 second before next insert batch...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log('\n=== SUMMARY ===');
      console.log(`Total tweets processed: ${tweetUrls.length}`);
      console.log(`Successful articles created: ${articles.length}`);
      console.log(`Failed: ${tweetUrls.length - articles.length}`);
    } else {
      console.log('No articles were successfully processed');
    }
    
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
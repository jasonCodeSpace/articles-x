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

// Function to generate a slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50);
}

// Function to extract full article content from article result
function extractFullArticleContent(articleResult: any): string {
  try {
    // First try content_state.blocks (the correct structure)
    if (articleResult?.content_state?.blocks && Array.isArray(articleResult.content_state.blocks)) {
      const textBlocks = articleResult.content_state.blocks
        .filter((block: any) => block.text && block.text.trim())
        .map((block: any) => block.text.trim());
      
      if (textBlocks.length > 0) {
        const fullContent = textBlocks.join('\n\n');
        console.log(`Extracted full article content: ${fullContent.length} characters`);
        return fullContent;
      }
    }
    
    // Fallback to old structure (content.blocks)
    if (articleResult?.content?.blocks && Array.isArray(articleResult.content.blocks)) {
      const textBlocks = articleResult.content.blocks
        .filter((block: any) => block.text && block.text.trim())
        .map((block: any) => block.text.trim());
      
      if (textBlocks.length > 0) {
        const fullContent = textBlocks.join('\n\n');
        console.log(`Extracted full article content (fallback): ${fullContent.length} characters`);
        return fullContent;
      }
    }
    
    // Final fallback to preview text or description
    console.log('No blocks found, using preview text as fallback');
    return articleResult?.preview_text || articleResult?.description || '';
  } catch (error) {
    console.error('Error extracting full article content:', error);
    return articleResult?.preview_text || articleResult?.description || '';
  }
}

// Function to fetch tweet details from API
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

// Function to process a single tweet
async function processTweet(tweetUrl: string, index: number): Promise<TweetData | null> {
  try {
    const tweetId = extractTweetId(tweetUrl);
    const username = extractUsername(tweetUrl);
    
    if (!tweetId) {
      console.log(`Could not extract tweet ID from ${tweetUrl}`);
      return null;
    }

    console.log(`Processing tweet ${index + 1}: ${tweetId}`);
    
    const data = await fetchTweetDetails(tweetId);
    
    if (!data || !data.data || !data.data.threaded_conversation_with_injections_v2) {
      console.log(`No data found for tweet ${tweetId}`);
      return null;
    }

    const instructions = data.data.threaded_conversation_with_injections_v2.instructions;
    if (!instructions || instructions.length === 0) {
      console.log(`No instructions found for tweet ${tweetId}`);
      return null;
    }

    let tweetResult = null;
    
    // Search through all instructions for the tweet result
    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
        for (const entry of instruction.entries) {
          if (entry.content?.itemContent?.tweet_results?.result) {
            tweetResult = entry.content.itemContent.tweet_results.result;
            console.log(`Tweet result found in instruction ${i}, entry ${entry.entryId}`);
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
    
    // Check for article data in the tweet
    const articleResult = tweetResult.article_results?.result || tweetResult.article?.article_results?.result;
    
    if (!articleResult) {
      console.log(`No article data found for tweet ${tweetId}, skipping...`);
      return null;
    }
    
    console.log(`Article data found for tweet ${tweetId}:`, {
      title: articleResult.title,
      hasPreviewText: !!articleResult.preview_text,
      hasDescription: !!articleResult.description,
      hasCoverMedia: !!articleResult.cover_media
    });
    
    // Generate article data from article_results
    const tweetText = legacy.full_text || legacy.text || 'No content available';
    const title = articleResult.title || tweetText.substring(0, 100) || 'Untitled Article';
    const slug = generateSlug(title) + '-' + Math.random().toString(36).substring(2, 8);
    const excerpt = articleResult.preview_text || articleResult.description || tweetText.substring(0, 200);
    const featuredImageUrl = articleResult.cover_media?.media_info?.original_img_url;
    
    // Extract full article content from article_results
    const fullArticleContent = extractFullArticleContent(articleResult);
    
    console.log(`Full article content extracted for tweet ${tweetId}:`, {
      contentLength: fullArticleContent.length,
      hasContent: fullArticleContent.length > 0,
      preview: fullArticleContent.substring(0, 100) + '...'
    });
    
    // Determine category based on username
    const categories = ['Technology', 'Business', 'Politics', 'Entertainment', 'Sports'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    const articleData: TweetData = {
      title: title,
      slug: slug,
      author_name: userLegacy?.name || username,
      image: featuredImageUrl || legacy.entities?.media?.[0]?.media_url_https,
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
      article_preview_text: excerpt,
      full_article_content: fullArticleContent || excerpt || title
    };

    return articleData;
  } catch (error) {
    console.error(`Error processing tweet ${tweetUrl}:`, error);
    return null;
  }
}

// Function to insert articles into Supabase with retry logic
async function insertArticles(articles: TweetData[], retryCount = 0): Promise<boolean> {
  const maxRetries = 3;
  
  try {
    console.log(`Inserting ${articles.length} articles into Supabase...`);
    
    const { data, error } = await supabase
      .from('articles')
      .insert(articles)
      .select();
    
    if (error) {
      console.error('Error inserting articles:', error);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying insertion (attempt ${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        return await insertArticles(articles, retryCount + 1);
      }
      
      return false;
    }
    
    console.log(`✓ Successfully inserted ${data?.length || articles.length} articles`);
    return true;
  } catch (error) {
    console.error('Failed to insert articles:', error);
    
    if (retryCount < maxRetries) {
      console.log(`Retrying insertion (attempt ${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await insertArticles(articles, retryCount + 1);
    }
    
    return false;
  }
}

// Function to save failed URLs for later retry
function saveFailedUrls(failedUrls: string[]) {
  if (failedUrls.length > 0) {
    const failedFile = path.join(__dirname, '..', 'failed-tweet-urls.txt');
    fs.writeFileSync(failedFile, failedUrls.join('\n'));
    console.log(`Saved ${failedUrls.length} failed URLs to failed-tweet-urls.txt`);
  }
}

// Main function
async function main() {
  try {
    // Read all tweet URLs from file
    const filePath = path.join(__dirname, '..', 'all-tweet-links.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Extract URLs (lines starting with https://)
    const tweetUrls = fileContent
      .split('\n')
      .filter(line => line.trim().startsWith('https://x.com/'))
      .map(line => line.trim());
    
    console.log(`Found ${tweetUrls.length} tweet URLs to process`);
    
    if (tweetUrls.length === 0) {
      console.error('No tweet URLs found in the file');
      return;
    }

    const batchSize = 10; // Process 10 tweets at a time
    const failedUrls: string[] = [];
    let totalProcessed = 0;
    let totalInserted = 0;
    
    for (let i = 0; i < tweetUrls.length; i += batchSize) {
      const batch = tweetUrls.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(tweetUrls.length / batchSize);
      
      console.log(`\n=== Processing batch ${batchNumber}/${totalBatches} (tweets ${i + 1}-${Math.min(i + batchSize, tweetUrls.length)}) ===`);
      
      const articles: TweetData[] = [];
      
      // Process tweets sequentially within batch
      for (let j = 0; j < batch.length; j++) {
        const url = batch[j];
        const globalIndex = i + j;
        
        try {
          const result = await processTweet(url, globalIndex);
          
          if (result) {
            articles.push(result);
            console.log(`✓ Successfully processed tweet ${globalIndex + 1}/${tweetUrls.length}`);
          } else {
            console.log(`✗ Failed to process tweet ${globalIndex + 1}/${tweetUrls.length}`);
            failedUrls.push(url);
          }
        } catch (error) {
          console.error(`✗ Error processing tweet ${globalIndex + 1}/${tweetUrls.length}:`, error);
          failedUrls.push(url);
        }
        
        totalProcessed++;
        
        // Add delay between individual tweets to avoid rate limiting
        if (j < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Insert articles if any were successfully processed
      if (articles.length > 0) {
        const insertSuccess = await insertArticles(articles);
        if (insertSuccess) {
          totalInserted += articles.length;
        } else {
          // Add failed articles back to failed URLs
          articles.forEach(article => {
            if (article.article_url) {
              failedUrls.push(article.article_url);
            }
          });
        }
      }
      
      console.log(`Batch ${batchNumber} complete: ${articles.length} articles processed, ${totalInserted} total inserted`);
      
      // Add delay between batches
      if (i + batchSize < tweetUrls.length) {
        console.log('Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n=== Final Results ===`);
    console.log(`Total tweets processed: ${totalProcessed}`);
    console.log(`Total articles inserted: ${totalInserted}`);
    console.log(`Failed URLs: ${failedUrls.length}`);
    
    // Save failed URLs for retry
    saveFailedUrls(failedUrls);
    
    if (failedUrls.length > 0) {
      console.log(`\nTo retry failed URLs, run the script again with the failed-tweet-urls.txt file.`);
    }
    
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
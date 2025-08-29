import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Twitter API configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';

interface ArticleData {
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

// Function to process a single tweet and extract article data
async function processTweetForArticle(tweetId: string, authorHandle: string): Promise<ArticleData | null> {
  try {
    console.log(`Processing article tweet: ${tweetId} by @${authorHandle}`);
    
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
    
    const articleUrl = `https://x.com/${authorHandle}/status/${tweetId}`;
    
    const articleData: ArticleData = {
      title: title,
      slug: slug,
      author_name: userLegacy?.name || authorHandle,
      image: featuredImageUrl || legacy.entities?.media?.[0]?.media_url_https,
      author_handle: authorHandle,
      author_avatar: userLegacy?.profile_image_url_https,
      article_published_at: new Date(legacy.created_at || Date.now()).toISOString(),
      article_url: articleUrl,
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
    console.error(`Error processing tweet ${tweetId}:`, error);
    return null;
  }
}

// Function to get article tweets from database
async function getArticleTweets(): Promise<{tweet_id: string, author_handle: string}[]> {
  try {
    const { data, error } = await supabase
      .from('tweets')
      .select('tweet_id, author_handle')
      .eq('is_article', true);
    
    if (error) {
      console.error('Error fetching article tweets:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} article tweets to process`);
    return data || [];
  } catch (error) {
    console.error('Failed to fetch article tweets:', error);
    return [];
  }
}

// Function to insert article into Supabase
async function insertArticle(article: ArticleData, retryCount = 0): Promise<boolean> {
  const maxRetries = 3;
  
  try {
    console.log(`Inserting article: ${article.title}`);
    
    const { data, error } = await supabase
      .from('articles')
      .insert([article])
      .select();
    
    if (error) {
      console.error('Error inserting article:', error);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying insertion (attempt ${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await insertArticle(article, retryCount + 1);
      }
      
      return false;
    }
    
    console.log(`✓ Successfully inserted article: ${article.title}`);
    return true;
  } catch (error) {
    console.error('Failed to insert article:', error);
    
    if (retryCount < maxRetries) {
      console.log(`Retrying insertion (attempt ${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await insertArticle(article, retryCount + 1);
    }
    
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting Process Article Tweets job...');
    
    // Get all article tweets from database
    const articleTweets = await getArticleTweets();
    
    if (articleTweets.length === 0) {
      console.log('No article tweets found to process');
      return;
    }
    
    let processedCount = 0;
    let insertedCount = 0;
    let failedCount = 0;
    
    // Process each article tweet
    for (let i = 0; i < articleTweets.length; i++) {
      const { tweet_id, author_handle } = articleTweets[i];
      
      console.log(`\n=== Processing ${i + 1}/${articleTweets.length}: @${author_handle}/status/${tweet_id} ===`);
      
      try {
        const articleData = await processTweetForArticle(tweet_id, author_handle);
        
        if (articleData) {
          const insertSuccess = await insertArticle(articleData);
          
          if (insertSuccess) {
            insertedCount++;
            console.log(`✓ Successfully processed and inserted article ${i + 1}/${articleTweets.length}`);
          } else {
            failedCount++;
            console.log(`✗ Failed to insert article ${i + 1}/${articleTweets.length}`);
          }
        } else {
          failedCount++;
          console.log(`✗ Failed to process tweet ${i + 1}/${articleTweets.length}`);
        }
        
        processedCount++;
        
        // Add delay between requests to avoid rate limiting
        if (i < articleTweets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`Error processing tweet ${tweet_id}:`, error);
        failedCount++;
      }
    }
    
    console.log(`\n=== Process Article Tweets Job Complete ===`);
    console.log(`Total tweets processed: ${processedCount}`);
    console.log(`Articles successfully inserted: ${insertedCount}`);
    console.log(`Failed: ${failedCount}`);
    
  } catch (error) {
    console.error('Process Article Tweets job failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
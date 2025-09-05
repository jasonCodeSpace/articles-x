import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';
const CRON_SECRET = process.env.CRON_SECRET;
const supabase = createServiceClient();

interface ArticleData {
  id?: string;
  title: string;
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



// Define interfaces for API response types
interface ContentBlock {
  text?: string;
  [key: string]: unknown;
}

interface ContentState {
  blocks?: ContentBlock[];
  [key: string]: unknown;
}

interface ArticleResult {
  content_state?: ContentState;
  content?: ContentState;
  preview_text?: string;
  description?: string;
  [key: string]: unknown;
}

interface MediaInfo {
  original_img_url?: string;
  [key: string]: unknown;
}

interface CoverMedia {
  media_info?: MediaInfo;
  [key: string]: unknown;
}

interface MediaEntity {
  media_url_https?: string;
  [key: string]: unknown;
}

interface UrlEntity {
  url?: string;
  expanded_url?: string;
  display_url?: string;
  [key: string]: unknown;
}

interface Entities {
  media?: MediaEntity[];
  urls?: UrlEntity[];
  [key: string]: unknown;
}

interface TweetLegacy {
  screen_name?: string;
  name?: string;
  profile_image_url_https?: string;
  full_text?: string;
  text?: string;
  created_at?: string;
  reply_count?: number;
  retweet_count?: number;
  favorite_count?: number;
  bookmark_count?: number;
  entities?: Entities;
  [key: string]: unknown;
}

interface ArticleResultWithNesting {
  result?: ArticleResult;
  article_results?: {
    result?: ArticleResult;
  };
  [key: string]: unknown;
}

interface ExtendedArticleResult extends ArticleResult {
  title?: string;
  cover_media?: CoverMedia;
  [key: string]: unknown;
}

interface TweetResult {
  core?: {
    user_results?: {
      result?: {
        legacy?: TweetLegacy;
      };
    };
  };
  legacy?: TweetLegacy;
  article_results?: ArticleResultWithNesting;
  article?: ArticleResultWithNesting;
  views?: {
    count?: number;
  };
  [key: string]: unknown;
}

interface TweetEntry {
  entryId?: string;
  content?: {
    itemContent?: {
      tweet_results?: {
        result?: TweetResult;
      };
    };
  };
  [key: string]: unknown;
}

interface TweetInstruction {
  type?: string;
  entries?: TweetEntry[];
  [key: string]: unknown;
}

interface ThreadedConversation {
  instructions?: TweetInstruction[];
  [key: string]: unknown;
}

interface TweetData {
  threaded_conversation_with_injections_v2?: ThreadedConversation;
  [key: string]: unknown;
}

interface TweetApiResponse {
  article_results?: ArticleResult[];
  data?: TweetData;
  [key: string]: unknown;
}

// Function to extract URLs from tweet entities
function extractUrlsFromTweet(legacy: TweetLegacy): string[] {
  const urls: string[] = [];
  
  if (legacy.entities?.urls && Array.isArray(legacy.entities.urls)) {
    for (const urlEntity of legacy.entities.urls) {
      // Prefer expanded_url over url
      const finalUrl = urlEntity.expanded_url || urlEntity.url;
      // Only accept external article URLs, exclude twitter/x.com links
      if (finalUrl && 
          !finalUrl.includes('twitter.com') && 
          !finalUrl.includes('x.com') &&
          (finalUrl.startsWith('http://') || finalUrl.startsWith('https://'))) {
        urls.push(finalUrl);
      }
    }
  }
  
  return urls;
}



// Function to validate if content is a legitimate article
function isValidArticle(articleUrl: string): boolean {
  // Only check if the article URL contains x.com
  const isValidUrl = articleUrl.includes('x.com');
  
  if (!isValidUrl) {
    console.log(`Article URL validation failed: ${articleUrl} does not contain x.com`);
    return false;
  }
  
  console.log(`Article URL validation passed: ${articleUrl}`);
  return true;
}

// Function to extract article content from external URL using RapidAPI
async function extractArticleFromUrl(url: string, retries: number = 3): Promise<{title?: string, content?: string, description?: string} | null> {
  console.log(`Extracting article content from URL: ${url} (retries left: ${retries})`);
  
  // First try: Use Article Extractor API from RapidAPI
  try {
    const apiUrl = `https://article-extractor-and-summarizer.p.rapidapi.com/extract?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'article-extractor-and-summarizer.p.rapidapi.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.title && data.content) {
        console.log(`Successfully extracted article from ${url}:`, {
          title: data.title?.substring(0, 50),
          contentLength: data.content?.length || 0
        });
        return {
          title: data.title,
          content: data.content,
          description: data.description
        };
      }
    }
    
    console.log(`RapidAPI extraction failed for ${url}: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.error(`RapidAPI extraction error for ${url}:`, error);
  }
  
  // Fallback: Try direct web scraping with better headers
  try {
    console.log(`Trying direct web scraping for ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow'
    });
    
    if (response.ok) {
      const html = await response.text();
      const extractedContent = extractContentFromHtml(html, url);
      
      if (extractedContent && extractedContent.content) {
        console.log(`Successfully scraped content from ${url}:`, {
          title: extractedContent.title?.substring(0, 50),
          contentLength: extractedContent.content?.length || 0
        });
        return extractedContent;
      }
    }
    
    console.log(`Direct scraping failed for ${url}: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.error(`Direct scraping error for ${url}:`, error);
  }
  
  // Retry with exponential backoff if retries left
  if (retries > 0) {
    const delay = (4 - retries) * 2000; // 2s, 4s, 6s delays
    console.log(`Retrying ${url} after ${delay}ms delay...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return extractArticleFromUrl(url, retries - 1);
  }
  
  console.error(`All extraction methods failed for ${url}`);
  return null;
}

// Helper function to extract content from HTML
function extractContentFromHtml(html: string, url: string): {title?: string, content?: string, description?: string} | null {
  try {
    // Basic HTML parsing to extract title and content
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Try to extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract main content - look for common article containers
    let content = '';
    const contentSelectors = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class=["'][^"']*post[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<div[^>]*class=["'][^"']*entry[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    ];
    
    for (const selector of contentSelectors) {
      const match = html.match(selector);
      if (match && match[1]) {
        content = match[1];
        break;
      }
    }
    
    // If no specific content container found, try to extract from body
    if (!content) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        content = bodyMatch[1];
      }
    }
    
    // Clean up HTML tags and extract text
    if (content) {
      // Remove script and style tags
      content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      
      // Remove HTML tags but keep line breaks
      content = content.replace(/<br[^>]*>/gi, '\n');
      content = content.replace(/<\/p>/gi, '\n\n');
      content = content.replace(/<[^>]+>/g, '');
      
      // Clean up whitespace
      content = content.replace(/\s+/g, ' ').trim();
      
      // Only return if we have substantial content
      if (content.length > 200) {
        return {
          title: title || `Article from ${new URL(url).hostname}`,
          content: content,
          description: description || content.substring(0, 200)
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error parsing HTML from ${url}:`, error);
    return null;
  }
}

// Function to extract full article content from article result
function extractFullArticleContent(articleResult: ArticleResult): string {
  try {
    // First try content_state.blocks (the correct structure)
    if (articleResult?.content_state?.blocks && Array.isArray(articleResult.content_state.blocks)) {
      const textBlocks = articleResult.content_state.blocks
        .filter((block: ContentBlock) => block.text && block.text.trim())
        .map((block: ContentBlock) => block.text!.trim());
      
      if (textBlocks.length > 0) {
        const fullContent = textBlocks.join('\n\n');
        console.log(`Extracted full article content: ${fullContent.length} characters`);
        return fullContent;
      }
    }
    
    // Fallback to old structure (content.blocks)
    if (articleResult?.content?.blocks && Array.isArray(articleResult.content.blocks)) {
      const textBlocks = articleResult.content.blocks
        .filter((block: ContentBlock) => block.text && block.text.trim())
        .map((block: ContentBlock) => block.text!.trim());
      
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
async function fetchTweetDetails(tweetId: string, retries: number = 3): Promise<TweetApiResponse | null> {
  console.log(`Fetching tweet details for ${tweetId} from RapidAPI...`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `https://${RAPIDAPI_HOST}/tweet?pid=${tweetId}`;
      console.log(`Attempt ${attempt}/${retries} - Calling: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      });

      console.log(`API response status for tweet ${tweetId}: ${response.status}`);

      if (response.status === 404) {
        console.log(`Tweet ${tweetId} not found (404) - skipping`);
        return null;
      }

      if (response.status === 429) {
        console.log(`Rate limited for tweet ${tweetId}, waiting ${attempt * 5} seconds...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 5000));
        continue;
      }

      if (response.status === 401) {
        console.error(`Unauthorized API access for tweet ${tweetId} - check RAPIDAPI_KEY`);
        throw new Error(`API authentication failed: Invalid RAPIDAPI_KEY`);
      }

      if (response.status === 403) {
        console.error(`Forbidden API access for tweet ${tweetId} - check API permissions or quota`);
        throw new Error(`API access forbidden: Check API permissions or quota`);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error(`HTTP error for tweet ${tweetId}:`, {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log(`Successfully fetched data for tweet ${tweetId}`);
      return data;
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed for tweet ${tweetId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (attempt === retries) {
        console.error(`All ${retries} attempts failed for tweet ${tweetId}`);
        return null;
      }
      
      const waitTime = 2000 * attempt;
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
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
      console.log(`No article data found for tweet ${tweetId}, trying to extract from URLs...`);
      
      // Try to extract URLs from the tweet
      const urls = extractUrlsFromTweet(legacy);
      
      if (urls.length === 0) {
        console.log(`No external URLs found in tweet ${tweetId}, marking as non-article...`);
        
        // Update the tweet in database to mark it as not having an article
        try {
          const supabase = createServiceClient();
          await supabase
            .from('tweets')
            .update({ has_article: false })
            .eq('tweet_id', tweetId);
          console.log(`Updated tweet ${tweetId} has_article to false`);
        } catch (updateError) {
          console.error(`Error updating tweet ${tweetId}:`, updateError);
        }
        
        return null;
      }
      
      // Try to extract article content from the first URL
      const firstUrl = urls[0];
      console.log(`Attempting to extract article from URL: ${firstUrl}`);
      
      const extractedArticle = await extractArticleFromUrl(firstUrl);
      
      if (!extractedArticle || !extractedArticle.content) {
        console.log(`Failed to extract article content from ${firstUrl}, marking as non-article...`);
        
        // Update the tweet in database to mark it as not having an article
        try {
          const supabase = createServiceClient();
          await supabase
            .from('tweets')
            .update({ has_article: false })
            .eq('tweet_id', tweetId);
          console.log(`Updated tweet ${tweetId} has_article to false`);
        } catch (updateError) {
          console.error(`Error updating tweet ${tweetId}:`, updateError);
        }
        
        return null;
      }
      
      // Validate article content quality
      const tweetText = legacy.full_text || legacy.text || 'No content available';
      const title = extractedArticle.title || tweetText.substring(0, 100) || 'Untitled Article';
      const content = extractedArticle.content || '';
      
      // Check if this is a legitimate article
      if (!isValidArticle(firstUrl)) {
        console.log(`Article URL validation failed for ${firstUrl}, marking as non-article...`);
        
        // Update the tweet in database to mark it as not having an article
        try {
          const supabase = createServiceClient();
          await supabase
            .from('tweets')
            .update({ has_article: false })
            .eq('tweet_id', tweetId);
          console.log(`Updated tweet ${tweetId} has_article to false due to content validation`);
        } catch (updateError) {
          console.error(`Error updating tweet ${tweetId}:`, updateError);
        }
        
        return null;
      }
      
      // Create article data from extracted content
      const excerpt = extractedArticle.description || tweetText.substring(0, 200);
      
      // Category will be assigned by AI cron job
      const category = '';
      
      const articleUrl = firstUrl;
      
      const articleData: ArticleData = {
        title: title,
        author_name: userLegacy?.name || authorHandle,
        image: legacy.entities?.media?.[0]?.media_url_https,
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
        full_article_content: extractedArticle.content || excerpt || title
      };
      
      console.log(`Successfully extracted article from URL for tweet ${tweetId}:`, {
        title: title.substring(0, 50),
        contentLength: extractedArticle.content?.length || 0,
        url: firstUrl
      });
      
      return articleData;
    }
    
    // Cast to extended article result for proper typing
    const extendedArticleResult = articleResult as ExtendedArticleResult;
    
    console.log(`Article data found for tweet ${tweetId}:`, {
      title: extendedArticleResult.title,
      hasPreviewText: !!extendedArticleResult.preview_text,
      hasDescription: !!extendedArticleResult.description,
      hasCoverMedia: !!extendedArticleResult.cover_media
    });
    
    // Generate article data from article_results
    const tweetText = legacy.full_text || legacy.text || 'No content available';
    const title = extendedArticleResult.title || tweetText.substring(0, 100) || 'Untitled Article';
    const excerpt = extendedArticleResult.preview_text || extendedArticleResult.description || tweetText.substring(0, 200);
    const featuredImageUrl = extendedArticleResult.cover_media?.media_info?.original_img_url;
    
    // Extract full article content from article_results
    const fullArticleContent = extractFullArticleContent(extendedArticleResult);
    
    console.log(`Full article content extracted for tweet ${tweetId}:`, {
      contentLength: fullArticleContent.length,
      hasContent: fullArticleContent.length > 0,
      preview: fullArticleContent.substring(0, 100) + '...'
    });
    
    // Category will be assigned by AI cron job
    const category = '';
    
    const articleUrl = `https://x.com/${authorHandle}/status/${tweetId}`;
    
    // Validate article URL
    if (!isValidArticle(articleUrl)) {
      console.log(`Article URL validation failed for tweet ${tweetId}, marking as non-article...`);
      
      // Update the tweet in database to mark it as not having an article
      try {
        const supabase = createServiceClient();
        await supabase
          .from('tweets')
          .update({ has_article: false })
          .eq('tweet_id', tweetId);
        console.log(`Updated tweet ${tweetId} has_article to false due to content validation`);
      } catch (updateError) {
        console.error(`Error updating tweet ${tweetId}:`, updateError);
      }
      
      return null;
    }
    
    const articleData: ArticleData = {
      title: title,
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

// Function to insert article into Supabase
async function insertArticle(article: ArticleData, retryCount = 0): Promise<boolean> {
  const maxRetries = 3;
  
  try {
    console.log(`Inserting article: ${article.title}`);
    
    const supabase = createServiceClient();
    
    // Check if article with this tweet_id already exists
    const { data: existingArticle, error: checkError } = await supabase
      .from('articles')
      .select('id')
      .eq('tweet_id', article.tweet_id)
      .maybeSingle();
    
    // Ignore "not found" errors, but handle other errors
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing article:', checkError);
      throw checkError;
    }
    
    let error;
    if (existingArticle) {
      // Update existing article (exclude category to prevent overwriting)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { category, ...articleWithoutCategory } = article;
      const { error: updateError } = await supabase
        .from('articles')
        .update(articleWithoutCategory)
        .eq('tweet_id', article.tweet_id);
      error = updateError;
      console.log(`Updated existing article for tweet ${article.tweet_id} (category preserved)`);
    } else {
      // Insert new article
      const { error: insertError } = await supabase
        .from('articles')
        .insert([article]);
      error = insertError;
      console.log(`Inserted new article for tweet ${article.tweet_id}`);
    }
    
    if (error) {
      console.error('Error saving article:', error);
      
      // If it's a duplicate key error, treat it as success since the article already exists
      if (error.code === '23505') {
        console.log(`Article already exists (duplicate key), treating as success: ${article.title}`);
        return true;
      }
      
      // For other errors, retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        console.log(`Retrying insertion (attempt ${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await insertArticle(article, retryCount + 1);
      }
      
      return false;
    }
    
    console.log(`✓ Successfully saved article: ${article.title}`);
    return true;
  } catch (error: unknown) {
    console.error('Failed to save article:', error);
    
    // If it's a duplicate key error, treat it as success since the article already exists
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      console.log(`Article already exists (duplicate key), treating as success: ${article.title}`);
      return true;
    }
    
    // For other errors, retry if we haven't exceeded max retries
    if (retryCount < maxRetries) {
      console.log(`Retrying insertion (attempt ${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await insertArticle(article, retryCount + 1);
    }
    
    return false;
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== CRON_SECRET) {
    console.error('Unauthorized access attempt to process-articles API');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check required environment variables
  if (!RAPIDAPI_KEY) {
    console.error('RAPIDAPI_KEY environment variable is missing');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Configuration error: RAPIDAPI_KEY not configured',
        details: 'Missing required environment variable'
      },
      { status: 500 }
    );
  }

  if (!CRON_SECRET) {
    console.error('CRON_SECRET environment variable is missing');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Configuration error: CRON_SECRET not configured',
        details: 'Missing required environment variable'
      },
      { status: 500 }
    );
  }

  console.log('Starting process-articles API execution...');
  console.log('Environment check:', {
    rapidApiKeyConfigured: !!RAPIDAPI_KEY,
    cronSecretConfigured: !!CRON_SECRET,
    rapidApiHost: RAPIDAPI_HOST
  });

  try {
    const supabase = createServiceClient();
    console.log('Supabase client created successfully');
    
    // Get the latest 15 tweets where has_article is true but not yet processed (not in articles table)
    console.log('Fetching unprocessed article tweets from database...');
    
    // First get all processed tweet_ids
    const { data: processedTweets } = await supabase
      .from('articles')
      .select('tweet_id')
      .not('tweet_id', 'is', null);
    
    const processedTweetIds = new Set(processedTweets?.map(t => t.tweet_id) || []);
    console.log(`Found ${processedTweetIds.size} already processed tweets`);
    
    // Get all tweets with articles
    const { data: allTweets, error: fetchError } = await supabase
      .from('tweets')
      .select('tweet_id, author_handle')
      .eq('has_article', true)
      .order('created_at', { ascending: false })
      .limit(100); // Get more to filter locally
    
    if (fetchError) {
      console.error('Database error fetching tweets:', fetchError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Database error: Failed to fetch tweets', 
          details: fetchError.message,
          errorCode: fetchError.code
        },
        { status: 500 }
      );
    }
    
    // Filter out already processed tweets locally
     const tweets = allTweets?.filter(tweet => !processedTweetIds.has(tweet.tweet_id)).slice(0, 15) || [];
    
    if (!tweets || tweets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No article tweets found to process',
        processed: 0
      });
    }
    
    console.log(`Found ${tweets.length} article tweets to process`);
    
    const results = [];
    const errors = [];
    
    // Process each tweet
    for (const tweet of tweets) {
      try {
        console.log(`Processing tweet ${tweet.tweet_id} by @${tweet.author_handle}...`);
        
        const articleData = await processTweetForArticle(tweet.tweet_id, tweet.author_handle);
        
        if (articleData) {
          console.log(`Successfully extracted article data for tweet ${tweet.tweet_id}: "${articleData.title}"`);
          const insertSuccess = await insertArticle(articleData);
          
          if (insertSuccess) {
            console.log(`Successfully inserted article for tweet ${tweet.tweet_id}`);
            results.push({
              tweetId: tweet.tweet_id,
              success: true,
              title: articleData.title
            });
          } else {
            console.error(`Failed to insert article into database for tweet ${tweet.tweet_id}`);
            errors.push({
              tweetId: tweet.tweet_id,
              error: 'Failed to insert article into database'
            });
          }
        } else {
          console.error(`Failed to extract article data from tweet ${tweet.tweet_id}`);
          errors.push({
            tweetId: tweet.tweet_id,
            error: 'Failed to extract article data from tweet'
          });
        }
        
        console.log(`Completed processing tweet ${tweet.tweet_id}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing tweet ${tweet.tweet_id}:`, error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          tweetId: tweet.tweet_id,
          authorHandle: tweet.author_handle
        });
        errors.push({
          tweetId: tweet.tweet_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} tweets successfully`,
      processed: results.length,
      errors: errors.length,
      results: results,
      errorDetails: errors
    });
    
  } catch (error) {
    console.error('Error in process-articles API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process articles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
      const body = await request.json().catch(() => ({}));
      let { tweetIds } = body;

      // If no tweetIds provided, fetch recent tweets with has_article = true but not yet processed
      if (!tweetIds || !Array.isArray(tweetIds) || tweetIds.length === 0) {
        console.log('No tweetIds provided, fetching recent tweets with has_article = true but not yet processed');
        
        // Get tweets that don't have corresponding articles using NOT EXISTS
        let { data: tweetsWithArticles, error } = await supabase
          .rpc('get_unprocessed_tweets', { limit_count: 15 });
        
        console.log(`Found ${tweetsWithArticles?.length || 0} unprocessed tweets with articles`);
        
        // If the RPC function doesn't exist, fall back to a simpler approach
        if (error && error.code === 'PGRST202') {
          console.log('RPC function not found, using fallback query');
          const { data: fallbackTweets, error: fallbackError } = await supabase
            .from('tweets')
            .select('tweet_id, created_at')
            .eq('has_article', true)
            .order('created_at', { ascending: false })
            .limit(50);
          
          if (fallbackError) {
            console.error('Error fetching tweets with fallback:', fallbackError);
            return NextResponse.json(
              { error: 'Failed to fetch tweets' },
              { status: 500 }
            );
          }
          
          // Filter out tweets that already have articles
          const filteredTweets = [];
          for (const tweet of fallbackTweets || []) {
            const { data: existingArticle } = await supabase
              .from('articles')
              .select('tweet_id')
              .eq('tweet_id', tweet.tweet_id)
              .single();
            
            if (!existingArticle) {
              filteredTweets.push(tweet);
              if (filteredTweets.length >= 15) break;
            }
          }
          
          tweetsWithArticles = filteredTweets;
          error = null; // Clear the error since we handled it
          console.log(`After filtering: Found ${tweetsWithArticles?.length || 0} unprocessed tweets`);
        }
        
        if (error) {
          console.error('Error fetching tweets with articles:', error);
          return NextResponse.json(
            { error: 'Failed to fetch tweets with articles' },
            { status: 500 }
          );
        }
        
        if (tweetsWithArticles && tweetsWithArticles.length > 0) {
          tweetIds = tweetsWithArticles.map((tweet: { tweet_id: string; created_at: string }) => tweet.tweet_id);
        } else {
          tweetIds = [];
        }
        
        if (tweetIds.length === 0) {
          return NextResponse.json({
            success: true,
            message: 'No recent tweets with articles found to process',
            processed: 0,
            errors: 0
          });
        }
        
        console.log(`Found ${tweetIds.length} recent tweets with articles to process`);
      } else {
        console.log(`Processing ${tweetIds.length} specific tweet IDs`);
      }
      
      const results = [];
      const errors = [];
      
      // Process tweets concurrently with limited concurrency
      const concurrencyLimit = 5;
      const processTweet = async (tweetId: string) => {
        try {
          console.log(`Processing tweet ${tweetId}...`);
          
          // We need to get the author_handle from the tweet data
          // For now, we'll extract it from the API response
          const data = await fetchTweetDetails(tweetId);
          
          if (!data) {
            return {
              tweetId: tweetId,
              error: 'Failed to fetch tweet data'
            };
          }
          
          // Extract author handle from the response
          let authorHandle = 'unknown';
          try {
            const instructions = data.data?.threaded_conversation_with_injections_v2?.instructions;
            if (instructions) {
              for (const instruction of instructions) {
                if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
                  for (const entry of instruction.entries) {
                    const tweetResult = entry.content?.itemContent?.tweet_results?.result;
                    if (tweetResult) {
                      authorHandle = tweetResult.core?.user_results?.result?.legacy?.screen_name || 'unknown';
                      break;
                    }
                  }
                  if (authorHandle !== 'unknown') break;
                }
              }
            }
          } catch (e) {
            console.error('Error extracting author handle:', e);
          }
          
          const articleData = await processTweetForArticle(tweetId, authorHandle);
          
          if (articleData) {
            const insertSuccess = await insertArticle(articleData);
            
            if (insertSuccess) {
              return {
                tweetId: tweetId,
                success: true,
                title: articleData.title
              };
            } else {
              return {
                tweetId: tweetId,
                error: 'Failed to insert article into database'
              };
            }
          } else {
            return {
              tweetId: tweetId,
              error: 'Failed to extract article data from tweet'
            };
          }
        } catch (error) {
          console.error(`Error processing tweet ${tweetId}:`, error);
          return {
            tweetId: tweetId,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      };
      
      // Process tweets in batches with concurrency limit
      for (let i = 0; i < tweetIds.length; i += concurrencyLimit) {
        const batch = tweetIds.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(batch.map(processTweet));
        
        for (const result of batchResults) {
          if ('success' in result && result.success) {
            results.push(result);
          } else {
            errors.push(result);
          }
        }
      }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} tweets successfully`,
      processed: results.length,
      errors: errors.length,
      results: results,
      errorDetails: errors
    });
    
  } catch (error) {
    console.error('Error in process-articles POST API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process articles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
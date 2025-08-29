import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';
const CRON_SECRET = process.env.CRON_SECRET;

interface TwitterTweetResponse {
  data?: {
    tweetResult?: {
      result?: {
        rest_id?: string;
        core?: {
          user_results?: {
            result?: {
              legacy?: {
                name?: string;
                screen_name?: string;
                profile_image_url_https?: string;
              };
            };
          };
        };
        legacy?: {
          created_at?: string;
          full_text?: string;
          favorite_count?: number;
          retweet_count?: number;
          reply_count?: number;
          quote_count?: number;
          bookmark_count?: number;
          entities?: {
            urls?: Array<{
              expanded_url?: string;
              display_url?: string;
            }>;
          };
        };
        views?: {
          count?: string;
        };
        card?: {
          legacy?: {
            binding_values?: Array<{
              key?: string;
              value?: {
                string_value?: string;
              };
            }>;
          };
        };
      };
    };
  };
}

interface ArticleData {
  articlePreview: {
    title: string;
    description: string;
    image?: string;
  };
  author: {
    name: string;
    handle: string;
    avatar?: string;
  };
  publishedAt: string;
  fullContent: string;
  comments: unknown[];
  rawData: unknown;
}

async function fetchTweetDetails(tweetId: string): Promise<ArticleData> {
  const url = `https://${RAPIDAPI_HOST}/tweet`;
  
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST
    }
  };

  const response = await fetch(`${url}?id=${tweetId}`, options);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch tweet details: ${response.status}`);
  }

  const data: TwitterTweetResponse = await response.json();
  const tweetResult = data.data?.tweetResult?.result;
  
  if (!tweetResult) {
    throw new Error('Invalid tweet data structure');
  }

  // Extract article content from card data
  const cardData = tweetResult.card?.legacy?.binding_values || [];
  const titleBinding = cardData.find(b => b.key === 'title');
  const descriptionBinding = cardData.find(b => b.key === 'description');
  const imageBinding = cardData.find(b => b.key === 'thumbnail_image_large' || b.key === 'player_image');
  
  // Extract author info
  const authorData = tweetResult.core?.user_results?.result?.legacy;
  
  // Extract tweet content
  const legacy = tweetResult.legacy;
  const fullContent = legacy?.full_text || '';
  
  return {
    articlePreview: {
      title: titleBinding?.value?.string_value || 'Untitled Article',
      description: descriptionBinding?.value?.string_value || fullContent.substring(0, 200),
      image: imageBinding?.value?.string_value
    },
    author: {
      name: authorData?.name || 'Unknown Author',
      handle: authorData?.screen_name || 'unknown',
      avatar: authorData?.profile_image_url_https
    },
    publishedAt: legacy?.created_at || new Date().toISOString(),
    fullContent: fullContent,
    comments: [], // Comments would need separate API call
    rawData: data
  };
}

async function saveArticleToDatabase(articleData: ArticleData, tweetId: string) {
  const supabase = createServiceClient();
  
  try {
    // Generate slug from title
    const slug = articleData.articlePreview.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
    
    const articleRecord = {
      // Article content
      title: articleData.articlePreview.title,
      slug: slug,
      full_article_content: articleData.fullContent,
      article_preview_text: articleData.articlePreview.description,
      
      // Author info
      author_name: articleData.author.name,
      author_handle: articleData.author.handle,
      author_avatar: articleData.author.avatar,
      
      // Dates
      article_published_at: articleData.publishedAt,
      
      // Tweet data
      tweet_id: tweetId,
      tweet_text: articleData.fullContent,
      tweet_published_at: articleData.publishedAt,
      tweet_views: 0,
      tweet_replies: 0,
      tweet_retweets: 0,
      tweet_likes: 0,
      tweet_bookmarks: 0,
      
      // Image
      image: articleData.articlePreview.image,
      
      // System fields
      updated_at: new Date().toISOString(),
      category: 'twitter-import',
      article_url: `https://twitter.com/${articleData.author.handle}/status/${tweetId}`
    };
    
    // Check if article with this tweet_id already exists
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id')
      .eq('tweet_id', tweetId)
      .single();
    
    let error;
    if (existingArticle) {
      // Update existing article
      const { error: updateError } = await supabase
        .from('articles')
        .update(articleRecord)
        .eq('tweet_id', tweetId);
      error = updateError;
    } else {
      // Insert new article
      const { error: insertError } = await supabase
        .from('articles')
        .insert(articleRecord);
      error = insertError;
    }
    
    if (error) {
      console.error('Error saving article:', error);
      throw error;
    }
    
    console.log(`Successfully saved article for tweet ${tweetId}`);
  } catch (error) {
    console.error('Error saving article to database:', error);
    throw error;
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
    const body = await request.json();
    const { tweetIds } = body;

    if (!tweetIds || !Array.isArray(tweetIds) || tweetIds.length === 0) {
      return NextResponse.json(
        { error: 'tweetIds array is required' },
        { status: 400 }
      );
    }

    console.log(`Processing ${tweetIds.length} specific tweet IDs`);
    
    const results = [];
    const errors = [];
    
    // Process each tweet ID
    for (const tweetId of tweetIds) {
      try {
        console.log(`Processing tweet ${tweetId}...`);
        
        const articleData = await fetchTweetDetails(tweetId);
        await saveArticleToDatabase(articleData, tweetId);
        
        results.push({
          tweetId: tweetId,
          success: true,
          title: articleData.articlePreview.title
        });
        
        console.log(`Successfully processed tweet ${tweetId}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing tweet ${tweetId}:`, error);
        errors.push({
          tweetId: tweetId,
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

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const supabase = createServiceClient();
    
    // Get all tweets where is_article is true and haven't been processed yet
    const { data: tweets, error: fetchError } = await supabase
      .from('tweets')
      .select('tweet_id')
      .eq('is_article', true)
      .is('processed_at', null) // Only get unprocessed tweets
      .limit(50); // Process in batches of 50
    
    if (fetchError) {
      console.error('Error fetching tweets:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch tweets', details: fetchError.message },
        { status: 500 }
      );
    }
    
    if (!tweets || tweets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unprocessed article tweets found',
        processed: 0
      });
    }
    
    console.log(`Found ${tweets.length} article tweets to process`);
    
    const results = [];
    const errors = [];
    
    // Process each tweet
    for (const tweet of tweets) {
      try {
        console.log(`Processing tweet ${tweet.tweet_id}...`);
        
        const articleData = await fetchTweetDetails(tweet.tweet_id);
        await saveArticleToDatabase(articleData, tweet.tweet_id);
        
        // Mark tweet as processed
        const supabaseForUpdate = createServiceClient();
        await supabaseForUpdate
          .from('tweets')
          .update({ processed_at: new Date().toISOString() })
          .eq('tweet_id', tweet.tweet_id);
        
        results.push({
          tweetId: tweet.tweet_id,
          success: true,
          title: articleData.articlePreview.title
        });
        
        console.log(`Successfully processed tweet ${tweet.tweet_id}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing tweet ${tweet.tweet_id}:`, error);
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
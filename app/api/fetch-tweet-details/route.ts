import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSlugFromTitle, generateShortId } from '@/lib/url-utils';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';

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
        blocks?: Array<{
          text?: string;
        }>;
      };
    };
    threaded_conversation_with_injections_v2?: {
      instructions?: Array<{
        entries?: Array<{
          content?: {
            itemContent?: {
              tweet_results?: {
                result?: {
                  core?: {
                    user_results?: {
                      result?: {
                        legacy?: {
                          name?: string;
                          screen_name?: string;
                        };
                      };
                    };
                  };
                  legacy?: {
                    full_text?: string;
                  };
                };
              };
            };
          };
        }>;
      }>;
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractArticleInfo(tweetData: any) {
  console.log('Raw tweet data structure:', JSON.stringify(tweetData, null, 2));
  
  // Navigate to the original tweet using the provided path:
  // data -> threaded_conversation_with_injections_v2 -> instructions[1] -> entries[0] -> content -> itemContent -> tweet_results -> result
  const instructions = tweetData?.data?.threaded_conversation_with_injections_v2?.instructions;
  if (!instructions || !Array.isArray(instructions) || instructions.length < 2) {
    console.log('No instructions found or insufficient instructions in API response');
    throw new Error('Invalid tweet data structure - no instructions found');
  }
  
  // Get the second instruction (index 1) as specified in the guide
  const targetInstruction = instructions[1];
  if (!targetInstruction || !targetInstruction.entries || !Array.isArray(targetInstruction.entries)) {
    console.log('No entries found in instruction[1]');
    throw new Error('Invalid tweet data structure - no entries found in instruction[1]');
  }
  
  // Get the first entry (index 0) which contains the original tweet
  const originalTweetEntry = targetInstruction.entries[0];
  if (!originalTweetEntry) {
    console.log('No entry found at entries[0]');
    throw new Error('Invalid tweet data structure - no entry found at entries[0]');
  }
  
  const result = originalTweetEntry.content?.itemContent?.tweet_results?.result;
  
  if (!result) {
    console.log('No result found in original tweet entry');
    console.log('Available keys in originalTweetEntry:', Object.keys(originalTweetEntry || {}));
    throw new Error('Invalid tweet data structure - no tweet result found');
  }

  // Extract author information using the provided paths
  // [...原始推文] -> core -> user_results -> result -> legacy -> name/screen_name/profile_image_url_https
  const authorInfo = result.core?.user_results?.result?.legacy;
  console.log('Author info extracted:', JSON.stringify(authorInfo, null, 2));
  const author = {
    username: authorInfo?.name || '',
    handle: authorInfo?.screen_name || '',
    profileImage: authorInfo?.profile_image_url_https || ''
  };
  console.log('Author object:', JSON.stringify(author, null, 2));

  // Extract tweet metadata using the provided paths
  // [...原始推文] -> legacy -> created_at/reply_count/retweet_count/favorite_count/bookmark_count
  // [...原始推文] -> views -> count
  const legacy = result.legacy;
  const tweetMeta = {
    publishedAt: legacy?.created_at || '',
    text: legacy?.full_text || '',
    views: parseInt(result.views?.count || '0'),
    replies: legacy?.reply_count || 0,
    retweets: legacy?.retweet_count || 0,
    likes: legacy?.favorite_count || 0,
    bookmarks: legacy?.bookmark_count || 0
  };

  // Extract article data using the provided paths
  // [...原始推文] -> article -> article_results -> result
  const articleData = result.article?.article_results?.result;
  console.log('Article data extracted:', JSON.stringify(articleData, null, 2));
  
  // Extract article preview using the provided paths
  // [...文章基础路径] -> title/preview_text
  const articlePreview = {
    title: articleData?.title || '',
    text: articleData?.preview_text || ''
  };
  console.log('Article preview extracted:', JSON.stringify(articlePreview, null, 2));
  
  // Fallback to card data if article data not available
  if (!articlePreview.title || !articlePreview.text) {
    const cardBindings = result.card?.legacy?.binding_values || [];
    
    for (const binding of cardBindings) {
      if (binding.key === 'title' && binding.value?.string_value && !articlePreview.title) {
        articlePreview.title = binding.value.string_value;
      }
      if (binding.key === 'description' && binding.value?.string_value && !articlePreview.text) {
        articlePreview.text = binding.value.string_value;
      }
    }
  }

  // Extract full article content using the provided path
  // [...原始推文] -> article -> article_results -> result -> content_state -> blocks
  let fullContent = '';
  if (articleData && articleData.content_state?.blocks) {
    fullContent = articleData.content_state.blocks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((block: any) => block.text || '')
      .filter((text: string) => text.trim())
      .join('\n\n');
  }
  
  // If no article content, use tweet text as fallback
  if (!fullContent) {
    fullContent = legacy?.full_text || '';
  }

  // Extract comments using the provided path
  // data -> threaded_conversation_with_injections_v2 -> instructions[1] -> entries
  // From entries[1] onwards are comment threads
  const comments: Array<{
    content: string;
    authorUsername: string;
    authorHandle: string;
  }> = [];
  
  // Process entries starting from index 1 (skip the original tweet at index 0)
  const entries = targetInstruction.entries;
  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];
    
    // Look for items array in each entry
    const items = entry.content?.items || [];
  
  for (const item of items) {
      const commentResult = item.item?.itemContent?.tweet_results?.result;
      
      if (commentResult) {
        // Extract comment content and author using the provided paths
        // itemContent -> tweet_results -> result -> legacy -> full_text
        // itemContent -> tweet_results -> result -> core -> user_results -> result -> legacy -> name/screen_name
        const commentAuthor = commentResult.core?.user_results?.result?.legacy;
        const commentText = commentResult.legacy?.full_text;
        
        if (commentAuthor && commentText) {
          comments.push({
            content: commentText,
            authorUsername: commentAuthor.name || '',
            authorHandle: commentAuthor.screen_name || ''
          });
        }
      }
    }
  }

  return {
    author,
    tweetMeta,
    articlePreview,
    fullContent,
    comments,
    rawData: tweetData
  };
}

async function fetchTweetDetails(tweetId: string) {
  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/tweet?pid=${tweetId}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: TwitterTweetResponse = await response.json();
    return extractArticleInfo(data);
  } catch (error) {
    console.error(`Error fetching tweet details for ${tweetId}:`, error);
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveArticleToDatabase(articleData: any, tweetId: string) {
  const supabase = await createClient();
  
  try {
    // Generate slug from title and tweet ID
    const titleSlug = generateSlugFromTitle(articleData.articlePreview.title || 'Untitled Article');
    const shortId = generateShortId(tweetId);
    const slug = `${titleSlug}--${shortId}`;
    
    console.log('Article data received:', JSON.stringify(articleData, null, 2));
    
    // Prepare the data according to user requirements
    const articleRecord = {
      // Core identifiers
      tweet_id: tweetId,
      title: articleData.articlePreview.title || 'Untitled Article',
      slug: slug,
      
      // Author information
      author_name: articleData.author.username,
      author_handle: articleData.author.handle,
      author_avatar: articleData.author.profileImage,
      image: articleData.author.profileImage, // Using author avatar as image
      
      // Article content
      article_preview_text: articleData.articlePreview.text,
      full_article_content: articleData.fullContent,
      
      // Tweet metadata
      tweet_text: articleData.tweetMeta.text,
      tweet_published_at: articleData.tweetMeta.publishedAt ? new Date(articleData.tweetMeta.publishedAt).toISOString() : new Date().toISOString(),
      article_published_at: articleData.tweetMeta.publishedAt ? new Date(articleData.tweetMeta.publishedAt).toISOString() : new Date().toISOString(),
      
      // Tweet interaction data
      tweet_views: articleData.tweetMeta.views || 0,
      tweet_replies: articleData.tweetMeta.replies || 0,
      tweet_retweets: articleData.tweetMeta.retweets || 0,
      tweet_likes: articleData.tweetMeta.likes || 0,
      tweet_bookmarks: articleData.tweetMeta.bookmarks || 0,
      
      // Additional data
       comments_data: articleData.comments || [],
       raw_tweet_data: articleData.rawData,
       
       // System fields
       updated_at: new Date().toISOString(),
       category: 'twitter-import', // Default category
       article_url: `https://twitter.com/${articleData.author.handle}/status/${tweetId}` // Twitter URL
    };
    
    console.log('Article record to save:', JSON.stringify(articleRecord, null, 2));
    
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
  try {
    const { tweetId } = await request.json();
    
    if (!tweetId) {
      return NextResponse.json(
        { error: 'Tweet ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching details for tweet ${tweetId}...`);
    
    const articleData = await fetchTweetDetails(tweetId);
    await saveArticleToDatabase(articleData, tweetId);
    
    return NextResponse.json({
      success: true,
      message: `Successfully processed tweet ${tweetId}`,
      article: {
        title: articleData.articlePreview.title,
        author: articleData.author.handle,
        commentsCount: articleData.comments.length
      }
    });
  } catch (error) {
    console.error('Error in fetch-tweet-details API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch tweet details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method for manual testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tweetId = searchParams.get('tweetId');
  
  if (!tweetId) {
    return NextResponse.json(
      { error: 'Tweet ID is required as query parameter' },
      { status: 400 }
    );
  }

  try {
    console.log(`Fetching details for tweet ${tweetId}...`);
    
    const articleData = await fetchTweetDetails(tweetId);
    await saveArticleToDatabase(articleData, tweetId);
    
    return NextResponse.json({
      success: true,
      message: `Successfully processed tweet ${tweetId}`,
      article: {
        title: articleData.articlePreview.title,
        author: articleData.author.handle,
        commentsCount: articleData.comments.length
      }
    });
  } catch (error) {
    console.error('Error in fetch-tweet-details API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch tweet details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
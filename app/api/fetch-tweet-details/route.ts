import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

function extractArticleInfo(tweetData: any) {
  const result = tweetData?.data?.tweetResult?.result;
  
  if (!result) {
    throw new Error('Invalid tweet data structure');
  }

  // Extract author information
  const authorInfo = result.core?.user_results?.result?.legacy;
  const author = {
    username: authorInfo?.name || '',
    handle: authorInfo?.screen_name || '',
    profileImage: authorInfo?.profile_image_url_https || ''
  };

  // Extract tweet metadata
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

  // Extract article preview from card
  const cardBindings = result.card?.legacy?.binding_values || [];
  const articlePreview = {
    title: '',
    text: ''
  };
  
  for (const binding of cardBindings) {
    if (binding.key === 'title' && binding.value?.string_value) {
      articlePreview.title = binding.value.string_value;
    }
    if (binding.key === 'description' && binding.value?.string_value) {
      articlePreview.text = binding.value.string_value;
    }
  }

  // Extract full article content from blocks
  const blocks = result.blocks || [];
  const fullContent = blocks
    .map((block: any) => block.text || '')
    .filter((text: string) => text.trim())
    .join('\n\n');

  // Extract comments from threaded conversation
  const comments: Array<{
    content: string;
    authorUsername: string;
    authorHandle: string;
  }> = [];

  const instructions = tweetData?.data?.threaded_conversation_with_injections_v2?.instructions || [];
  
  for (const instruction of instructions) {
    const entries = instruction.entries || [];
    
    // Skip first entry (original tweet) and process comments
    for (let i = 1; i < entries.length; i++) {
      const entry = entries[i];
      const commentResult = entry.content?.itemContent?.tweet_results?.result;
      
      if (commentResult) {
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

async function saveArticleToDatabase(articleData: any, tweetId: string, listId: string) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('articles')
      .upsert({
        tweet_id: tweetId,
        title: articleData.articlePreview.title || 'Untitled Article',
        slug: `${articleData.author.handle}-${tweetId}`,
        content: articleData.fullContent || articleData.tweetMeta.text,
        excerpt: articleData.articlePreview.text,
        author_name: articleData.author.username,
        author_handle: articleData.author.handle,
        author_profile_image: articleData.author.profileImage,
        tweet_text: articleData.tweetMeta.text,
        tweet_published_at: new Date(articleData.tweetMeta.publishedAt).toISOString(),
        tweet_views_count: articleData.tweetMeta.views,
        tweet_replies_count: articleData.tweetMeta.replies,
        tweet_retweets_count: articleData.tweetMeta.retweets,
        tweet_likes_count: articleData.tweetMeta.likes,
        tweet_bookmarks_count: articleData.tweetMeta.bookmarks,
        article_preview_title: articleData.articlePreview.title,
        article_preview_text: articleData.articlePreview.text,
        full_article_content: articleData.fullContent,
        comments_data: articleData.comments,
        raw_tweet_data: articleData.rawData,
        list_id: listId,
        status: 'published',
        published_at: new Date().toISOString()
      }, {
        onConflict: 'tweet_id'
      });
    
    if (error) {
      console.error('Error saving article:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving article to database:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tweetId, listId } = await request.json();
    
    if (!tweetId) {
      return NextResponse.json(
        { error: 'Tweet ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching details for tweet ${tweetId}...`);
    
    const articleData = await fetchTweetDetails(tweetId);
    await saveArticleToDatabase(articleData, tweetId, listId || 'unknown');
    
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
  const listId = searchParams.get('listId');
  
  if (!tweetId) {
    return NextResponse.json(
      { error: 'Tweet ID is required as query parameter' },
      { status: 400 }
    );
  }

  try {
    console.log(`Fetching details for tweet ${tweetId}...`);
    
    const articleData = await fetchTweetDetails(tweetId);
    await saveArticleToDatabase(articleData, tweetId, listId || 'unknown');
    
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
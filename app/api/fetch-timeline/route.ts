import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';

// Twitter list IDs to fetch from
const TWITTER_LISTS = [
  '78468360',
  // Add other list IDs here
];

interface TwitterTimelineResponse {
  data?: {
    list?: {
      tweets_timeline?: {
        timeline?: {
          instructions?: Array<{
            entries?: Array<{
              content?: {
                itemContent?: {
                  tweet_results?: {
                    result?: {
                      rest_id?: string;
                      core?: {
                        user_results?: {
                          result?: {
                            legacy?: {
                              screen_name?: string;
                            };
                          };
                        };
                      };
                      legacy?: {
                        entities?: {
                          urls?: Array<{
                            expanded_url?: string;
                          }>;
                        };
                      };
                    };
                  };
                };
              };
            }>;
          }>;
        };
      };
    };
  };
}

function hasArticleLink(tweet: any): boolean {
  const urls = tweet?.legacy?.entities?.urls || [];
  return urls.some((url: any) => 
    url.expanded_url && url.expanded_url.includes('/i/article/')
  );
}

function extractTweetsFromTimeline(response: TwitterTimelineResponse): Array<{
  tweetId: string;
  authorHandle: string;
  hasArticle: boolean;
}> {
  const tweets: Array<{
    tweetId: string;
    authorHandle: string;
    hasArticle: boolean;
  }> = [];

  const instructions = response.data?.list?.tweets_timeline?.timeline?.instructions || [];
  
  for (const instruction of instructions) {
    const entries = instruction.entries || [];
    
    for (const entry of entries) {
      const tweetResult = entry.content?.itemContent?.tweet_results?.result;
      
      if (tweetResult?.rest_id && tweetResult?.core?.user_results?.result?.legacy?.screen_name) {
        const tweetId = tweetResult.rest_id;
        const authorHandle = tweetResult.core.user_results.result.legacy.screen_name;
        const hasArticle = hasArticleLink(tweetResult);
        
        tweets.push({
          tweetId,
          authorHandle,
          hasArticle
        });
      }
    }
  }
  
  return tweets;
}

async function fetchListTimeline(listId: string): Promise<Array<{
  tweetId: string;
  authorHandle: string;
  hasArticle: boolean;
}>> {
  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/list-timeline?listId=${listId}`,
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

    const data: TwitterTimelineResponse = await response.json();
    return extractTweetsFromTimeline(data);
  } catch (error) {
    console.error(`Error fetching timeline for list ${listId}:`, error);
    return [];
  }
}

async function saveTweetsToDatabase(tweets: Array<{
  tweetId: string;
  authorHandle: string;
  hasArticle: boolean;
}>, listId: string) {
  const supabase = await createClient();
  
  for (const tweet of tweets) {
    try {
      const { error } = await supabase
        .from('tweets')
        .upsert({
          tweet_id: tweet.tweetId,
          author_handle: tweet.authorHandle,
          has_article: tweet.hasArticle,
          list_id: listId,
        }, {
          onConflict: 'tweet_id'
        });
      
      if (error) {
        console.error('Error saving tweet:', error);
      }
    } catch (error) {
      console.error('Error saving tweet to database:', error);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    let totalTweets = 0;
    let totalArticles = 0;
    
    for (const listId of TWITTER_LISTS) {
      console.log(`Fetching timeline for list ${listId}...`);
      
      const tweets = await fetchListTimeline(listId);
      const articleTweets = tweets.filter(tweet => tweet.hasArticle);
      
      console.log(`Found ${tweets.length} tweets, ${articleTweets.length} with articles`);
      
      await saveTweetsToDatabase(tweets, listId);
      
      totalTweets += tweets.length;
      totalArticles += articleTweets.length;
      
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${TWITTER_LISTS.length} lists`,
      totalTweets,
      totalArticles,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in fetch-timeline API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch timeline',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
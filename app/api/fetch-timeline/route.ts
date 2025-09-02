import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';
const CRON_SECRET = process.env.CRON_SECRET;

// Twitter list IDs to fetch from
const TWITTER_LISTS = [
  '78468360',
  // Add other list IDs here
];

interface TwitterTimelineResponse {
  result?: {
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
            items?: Array<{
              item?: {
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
          };
        }>;
      }>;
    };
  };
}

function hasArticleLink(tweet: { legacy?: { entities?: { urls?: Array<{ expanded_url?: string }> } } }): boolean {
  const urls = tweet?.legacy?.entities?.urls || [];
  
  // Check for any external URLs that could be articles
  return urls.some((url: { expanded_url?: string }) => {
    if (!url.expanded_url) return false;
    
    const expandedUrl = url.expanded_url.toLowerCase();
    
    // Twitter native articles
    if (expandedUrl.includes('/i/article/')) return true;
    
    // Common article domains and patterns
    const articlePatterns = [
      // News sites
      'nytimes.com', 'washingtonpost.com', 'wsj.com', 'reuters.com', 'bloomberg.com',
      'cnn.com', 'bbc.com', 'theguardian.com', 'npr.org', 'apnews.com',
      // Tech/Business
      'techcrunch.com', 'wired.com', 'arstechnica.com', 'theverge.com', 'engadget.com',
      'forbes.com', 'businessinsider.com', 'fortune.com', 'fastcompany.com',
      // Sports
      'espn.com', 'athletic.com', 'si.com', 'bleacherreport.com',
      // Blogs and platforms
      'medium.com', 'substack.com', 'wordpress.com', 'blogspot.com',
      // Academic/Research
      'arxiv.org', 'nature.com', 'science.org', 'pnas.org',
      // Other common article sites
      'atlantic.com', 'newyorker.com', 'vox.com', 'slate.com', 'salon.com',
      'huffpost.com', 'politico.com', 'axios.com', 'buzzfeed.com'
    ];
    
    // Check if URL contains any article patterns
    const hasArticlePattern = articlePatterns.some(pattern => expandedUrl.includes(pattern));
    
    // Additional checks for article-like URLs
    const hasArticleKeywords = [
      '/article/', '/story/', '/news/', '/post/', '/blog/', '/opinion/',
      '/analysis/', '/feature/', '/report/', '/investigation/'
    ].some(keyword => expandedUrl.includes(keyword));
    
    // Exclude common non-article URLs
    const isNonArticle = [
      'youtube.com', 'youtu.be', 'twitter.com', 'x.com', 'instagram.com',
      'facebook.com', 'linkedin.com', 'tiktok.com', 'reddit.com',
      'github.com', 'stackoverflow.com', 'amazon.com', 'ebay.com'
    ].some(pattern => expandedUrl.includes(pattern));
    
    return (hasArticlePattern || hasArticleKeywords) && !isNonArticle;
  });
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

  const instructions = response.result?.timeline?.instructions || [];
  
  for (const instruction of instructions) {
    const entries = instruction.entries || [];
    
    for (const entry of entries) {
      // Check direct itemContent
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
      
      // Check items array for conversation threads
      const items = entry.content?.items || [];
      for (const item of items) {
        const itemTweetResult = item.item?.itemContent?.tweet_results?.result;
        
        if (itemTweetResult?.rest_id && itemTweetResult?.core?.user_results?.result?.legacy?.screen_name) {
          const tweetId = itemTweetResult.rest_id;
          const authorHandle = itemTweetResult.core.user_results.result.legacy.screen_name;
          const hasArticle = hasArticleLink(itemTweetResult);
          
          tweets.push({
            tweetId,
            authorHandle,
            hasArticle
          });
        }
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
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');
  
  if ((!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== CRON_SECRET) && 
      querySecret !== CRON_SECRET) {
    console.error('Unauthorized access attempt to fetch-timeline API');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

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
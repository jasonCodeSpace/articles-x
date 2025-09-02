import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';
const CRON_SECRET = process.env.CRON_SECRET;

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
    console.log(`Making API request for list ${listId}...`);
    const url = `https://${RAPIDAPI_HOST}/list-timeline?listId=${listId}`;
    console.log(`Request URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
    });

    console.log(`API response status for list ${listId}: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error for list ${listId}:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data: TwitterTimelineResponse = await response.json();
    console.log(`API data received for list ${listId}:`, {
      hasResult: !!data.result,
      hasTimeline: !!data.result?.timeline,
      instructionsCount: data.result?.timeline?.instructions?.length || 0
    });
    
    const tweets = extractTweetsFromTimeline(data);
    console.log(`Extracted ${tweets.length} tweets from list ${listId}`);
    return tweets;
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
    // Use hardcoded list IDs for reliability (first 3 from the default list)
    const allTwitterLists = [
      '1937404509015216229', // Crypto News 1
      '1935584949018493392', // Crypto News 2  
      '1935589446247735425'  // Crypto News 3
    ];
    
    console.log(`Processing ${allTwitterLists.length} Twitter lists`);

    let totalTweets = 0;
    let totalArticles = 0;
    
    const results = [];
    
    for (const listId of allTwitterLists) {
      try {
        console.log(`Fetching timeline for list ${listId}...`);
        
        const tweets = await fetchListTimeline(listId);
        const articleTweets = tweets.filter(tweet => tweet.hasArticle);
        
        console.log(`Found ${tweets.length} tweets, ${articleTweets.length} with articles`);
        
        await saveTweetsToDatabase(tweets, listId);
        
        totalTweets += tweets.length;
        totalArticles += articleTweets.length;
        
        results.push({
          listId,
          success: true,
          tweets: tweets.length,
          articles: articleTweets.length
        });
        
        console.log(`Successfully processed list ${listId}`);
        
      } catch (error) {
        console.error(`Error processing list ${listId}:`, error);
        results.push({
          listId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${allTwitterLists.length} lists`,
      totalTweets,
      totalArticles,
      results,
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
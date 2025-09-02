import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service';

// const CRON_SECRET = process.env.CRON_SECRET;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST!;

// Helper function to check authorization
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-cron-secret');
  const querySecret = request.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not set');
    return false;
  }
  
  return authHeader === cronSecret || querySecret === cronSecret;
}

// Helper function to extract article URL from tweet text
function extractArticleUrl(tweetText: string): string | null {
  // Look for URLs in the tweet text
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const urls = tweetText.match(urlRegex);
  
  if (!urls || urls.length === 0) {
    return null;
  }
  
  // Return the first URL found (assuming it's the article link)
  return urls[0];
}

// Helper function to check if tweet contains article indicators
function hasArticleIndicators(tweetText: string): boolean {
  const articleKeywords = [
    'article', 'blog', 'post', 'read', 'wrote', 'published',
    'medium.com', 'substack.com', 'dev.to', 'hashnode.com'
  ];
  
  const lowerText = tweetText.toLowerCase();
  return articleKeywords.some(keyword => lowerText.includes(keyword));
}

async function searchTwitter(query: string, count: number = 20) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://${RAPIDAPI_HOST}/search?type=Top&count=${count}&query=${encodedQuery}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': RAPIDAPI_KEY
    }
  });
  
  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Supabase client
    const supabase = createServiceClient();

    // Get authors from the database
    const { data: authors, error: authorsError } = await supabase
      .from('authors')
      .select('handle')
      .limit(50); // Limit to avoid rate limits

    if (authorsError) {
      console.error('Error fetching authors:', authorsError);
      return NextResponse.json(
        { error: 'Failed to fetch authors' },
        { status: 500 }
      );
    }

    if (!authors || authors.length === 0) {
      return NextResponse.json(
        { message: 'No authors found' },
        { status: 200 }
      );
    }

    const results = [];
    let tweetsToInsert: Array<{
      tweet_id: string;
      author_handle: string;
      tweet_text: string;
      article_url?: string;
      created_at: string;
      retweet_count: number;
      like_count: number;
      reply_count: number;
      quote_count: number;
      has_article: boolean;
      updated_at: string;
    }> = [];
    let searchCount = 0;

    // Process each author
    for (const author of authors) {
      try {
        // Search for tweets with articles from this author using filter:handle article
        const query = `filter:${author.handle} article`;
        const searchResults = await searchTwitter(query, 10);

        if (searchResults.result?.timeline?.instructions) {
          // Parse Twitter API response structure
          const instructions = searchResults.result.timeline.instructions;
          const timelineAddEntries = instructions.find((inst: { type: string; entries?: unknown[] }) => inst.type === 'TimelineAddEntries');
          
          if (timelineAddEntries?.entries) {
            for (const entry of timelineAddEntries.entries) {
              if (entry.entryId?.startsWith('tweet-')) {
                const tweetData = entry.content?.itemContent?.tweet_results?.result;
                if (tweetData && tweetData.legacy) {
                  const tweet = tweetData.legacy;
                  const tweetId = tweet.id_str;
                  
                  // Extract article URLs from tweet text
                  const articleUrl = extractArticleUrl(tweet.full_text);
                  const hasArticle = hasArticleIndicators(tweet.full_text) && articleUrl !== null;

                  // Check if tweet already exists
                  const { data: existingTweet } = await supabase
                    .from('tweets')
                    .select('id')
                    .eq('tweet_id', tweetId)
                    .single();

                  if (!existingTweet) {
                    tweetsToInsert.push({
                      tweet_id: tweetId,
                      author_handle: author.handle,
                      tweet_text: tweet.full_text || '',
                      article_url: articleUrl || undefined,
                      has_article: hasArticle,
                      retweet_count: tweet.retweet_count || 0,
                      like_count: tweet.favorite_count || 0,
                      reply_count: tweet.reply_count || 0,
                      quote_count: tweet.quote_count || 0,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    });
                  }
                }
              }
            }
          }
        }

        searchCount++;
        results.push({
          author: author.handle,
          tweetsFound: tweetsToInsert.filter(t => t.author_handle === author.handle).length
        });

        // Insert tweets every 10 searches
        if (searchCount % 10 === 0 && tweetsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('tweets')
            .insert(tweetsToInsert);

          if (insertError) {
            console.error('Error inserting tweets batch:', insertError);
          } else {
            console.log(`Inserted batch of ${tweetsToInsert.length} tweets`);
          }
          
          tweetsToInsert = []; // Reset for next batch
        }

        // Rate limiting: wait 200ms between requests (5 requests per second)
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (authorError) {
        console.error(`Error processing author ${author.handle}:`, authorError);
        results.push({
          author: author.handle,
          error: authorError instanceof Error ? authorError.message : 'Unknown error'
        });

        // If rate limited, wait longer
        if (authorError instanceof Error && authorError.message.includes('rate limit')) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Insert any remaining tweets
    if (tweetsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('tweets')
        .insert(tweetsToInsert);

      if (insertError) {
        console.error('Error inserting final tweets batch:', insertError);
        return NextResponse.json({ 
          error: 'Failed to insert final tweets batch', 
          details: insertError.message,
          results 
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Search completed',
      stats: {
        authorsProcessed: authors.length,
        totalTweetsInserted: searchCount * 10, // Approximate based on batches
        errors: results.filter(r => r.error).length
      },
      results
    });

  } catch (error) {
    console.error('Search articles error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Search Articles API - Use POST method to trigger search' },
    { status: 200 }
  );
}
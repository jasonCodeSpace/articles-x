import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Twitter URLs to process
const twitterUrls = [
  'https://x.com/mobyagent/status/1932462252109480065',
  'https://x.com/getmoni_io/status/1910321579461931185',
  'https://x.com/Mira_Network/status/1937884528481038641',
  'https://x.com/Mira_Network/status/1930649502408753391',
  'https://x.com/heavendex/status/1957622426096795875',
  'https://x.com/mobyagent/status/1940449573597495697',
  'https://x.com/wallet/status/1932707552032080209',
  'https://x.com/tetsuoai/status/1947186471150157931',
  'https://x.com/tetsuoai/status/1941652777303932974',
  'https://x.com/tetsuoai/status/1792127620072825143',
  'https://x.com/Phyrex_Ni/status/1935228362894815518',
  'https://x.com/roger9949/status/1926564306788733153',
  'https://x.com/tetsuoai/status/1941815795165872421',
  'https://x.com/tetsuoai/status/1941225522681479677',
  'https://x.com/tetsuoai/status/1941153428639715789',
  'https://x.com/getmoni_io/status/1940347306521362662',
  'https://x.com/tetsuoai/status/1941951721187766689',
  'https://x.com/HoloworldAI/status/1933285730865828241',
  'https://x.com/Covalent_HQ/status/1957915320754266546',
  'https://x.com/Ga__ke/status/1898941696144252930',
  'https://x.com/tetsuoai/status/1942154874055278918',
  'https://x.com/danielesesta/status/1932933919470457214',
  'https://x.com/HoloworldAI/status/1943711461647192111',
  'https://x.com/Phyrex_Ni/status/1945418518352331166',
  'https://x.com/SpaceIDProtocol/status/1925928316147544115',
  'https://x.com/HoloworldAI/status/1928869453376401585',
  'https://x.com/0x_xifeng/status/1954085092407882141',
  'https://x.com/Phyrex_Ni/status/1927617196509057347',
  'https://x.com/munchPRMR/status/1947477173826171061',
  'https://x.com/Phyrex_Ni/status/1953169889612710388',
  'https://x.com/S4mmyEth/status/1950187573495595063',
  'https://x.com/S4mmyEth/status/1945082220303020103',
  'https://x.com/mobyagent/status/1932459160785801603',
  'https://x.com/Phyrex_Ni/status/1932718441301246323',
  'https://x.com/Phyrex_Ni/status/1925088823505195024',
  'https://x.com/Phyrex_Ni/status/1948003384235323564',
  'https://x.com/MasonCanoe/status/1896877269324595305',
  'https://x.com/wallet/status/1950732288754659694'
];

// RapidAPI configuration
const RAPIDAPI_KEY = 'ab9b25a33dmsh9bbd3a16233f27dp1d0125jsn3cc5b2112be6';
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';

// Interface definitions based on API response
interface TwitterApiResponse {
  result: {
    tweetResult: {
      result: {
        __typename: string;
        rest_id: string;
        core: {
          user_results: {
            result: {
              __typename: string;
              id: string;
              rest_id: string;
              legacy: {
                name: string;
                screen_name: string;
                profile_image_url_https: string;
                description?: string;
                followers_count: number;
                friends_count: number;
                created_at: string;
              };
            };
          };
        };
        legacy: {
          created_at: string;
          full_text: string;
          favorite_count: number;
          retweet_count: number;
          reply_count: number;
          entities: {
            urls?: Array<{
              expanded_url: string;
              display_url: string;
            }>;
            media?: Array<{
              media_url_https: string;
              type: string;
            }>;
          };
          extended_entities?: {
            media?: Array<{
              media_url_https: string;
              type: string;
            }>;
          };
        };
        views?: {
          count: string;
        };
      };
    };
  };
}

interface ProcessedTweetData {
  // Author information
  authorName: string;
  authorHandle: string;
  authorProfileImage: string;
  
  // Article information (extracted from tweet content)
  articleTitle: string;
  articlePreview: string;
  articleCoverImage: string | null;
  articlePublishedAt: string;
  
  // Post information
  postUrl: string;
  postPublishedAt: string;
  tweetId: string;
}

// Extract tweet ID from URL
function extractTweetId(url: string): string {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : '';
}

// Fetch tweet data from RapidAPI
async function fetchTweetData(tweetId: string): Promise<TwitterApiResponse | null> {
  try {
    const response = await fetch(`https://twitter241.p.rapidapi.com/tweet-v2?pid=${tweetId}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch tweet ${tweetId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data as TwitterApiResponse;
  } catch (error) {
    console.error(`Error fetching tweet ${tweetId}:`, error);
    return null;
  }
}

// Process tweet data and extract required information
function processTweetData(apiResponse: TwitterApiResponse, originalUrl: string): ProcessedTweetData {
  const tweet = apiResponse.result.tweetResult.result;
  const user = tweet.core.user_results.result;
  const legacy = tweet.legacy;
  const userLegacy = user.legacy;

  // Extract article information from tweet content
  const fullText = legacy.full_text;
  
  // Use first line or first sentence as title
  const articleTitle = fullText.split('\n')[0].substring(0, 100) || fullText.substring(0, 100);
  
  // Use full text as preview (truncated)
  const articlePreview = fullText.substring(0, 300);
  
  // Extract cover image from media
  let articleCoverImage: string | null = null;
  if (legacy.extended_entities?.media && legacy.extended_entities.media.length > 0) {
    articleCoverImage = legacy.extended_entities.media[0].media_url_https;
  } else if (legacy.entities.media && legacy.entities.media.length > 0) {
    articleCoverImage = legacy.entities.media[0].media_url_https;
  }

  return {
    // Author information
    authorName: userLegacy.name,
    authorHandle: userLegacy.screen_name,
    authorProfileImage: userLegacy.profile_image_url_https,
    
    // Article information
    articleTitle: articleTitle,
    articlePreview: articlePreview,
    articleCoverImage: articleCoverImage,
    articlePublishedAt: legacy.created_at,
    
    // Post information
    postUrl: originalUrl,
    postPublishedAt: legacy.created_at,
    tweetId: tweet.rest_id
  };
}

// Save processed data to Supabase
async function saveToSupabase(processedData: ProcessedTweetData[]): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Prepare data for articles table
  const articlesData = processedData.map(data => ({
    title: data.articleTitle,
    content: data.articlePreview,
    excerpt: data.articlePreview.substring(0, 200),
    author_name: data.authorName,
    author_handle: data.authorHandle,
    author_profile_image: data.authorProfileImage,
    featured_image_url: data.articleCoverImage,
    article_url: data.postUrl,
    tweet_url: data.postUrl,
    tweet_id: data.tweetId,
    article_published_at: new Date(data.articlePublishedAt).toISOString(),
    tweet_published_at: new Date(data.postPublishedAt).toISOString(),
    published_at: new Date(data.articlePublishedAt).toISOString(),
    status: 'published',
    slug: `${data.authorHandle}-${data.tweetId}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  // Insert into articles table
  const { data: insertedArticles, error: articlesError } = await supabase
    .from('articles')
    .upsert(articlesData, { onConflict: 'slug' })
    .select();

  if (articlesError) {
    console.error('Error inserting articles:', articlesError);
    throw articlesError;
  }

  // Prepare data for tweets table
  const tweetsData = processedData.map(data => ({
    tweet_id: data.tweetId,
    author_name: data.authorName,
    author_handle: data.authorHandle,
    author_profile_image: data.authorProfileImage,
    tweet_text: data.articlePreview,
    created_at_twitter: data.postPublishedAt,
    has_article: true,
    article_url: data.postUrl,
    article_title: data.articleTitle,
    article_excerpt: data.articlePreview,
    article_featured_image: data.articleCoverImage,
    list_id: 'rapidapi_batch'
  }));

  // Insert into tweets table
  const { data: insertedTweets, error: tweetsError } = await supabase
    .from('tweets')
    .upsert(tweetsData, { onConflict: 'tweet_id' })
    .select();

  if (tweetsError) {
    console.error('Error inserting tweets:', tweetsError);
    throw tweetsError;
  }

  console.log(`Successfully saved ${insertedArticles?.length || 0} articles and ${insertedTweets?.length || 0} tweets`);
}

// Main processing function
async function processAllTweets(): Promise<void> {
  console.log(`Starting to process ${twitterUrls.length} Twitter URLs...`);
  
  const processedData: ProcessedTweetData[] = [];
  const errors: string[] = [];

  for (let i = 0; i < twitterUrls.length; i++) {
    const url = twitterUrls[i];
    const tweetId = extractTweetId(url);
    
    if (!tweetId) {
      console.error(`Could not extract tweet ID from URL: ${url}`);
      errors.push(`Invalid URL: ${url}`);
      continue;
    }

    console.log(`Processing ${i + 1}/${twitterUrls.length}: ${tweetId}`);
    
    try {
      const apiResponse = await fetchTweetData(tweetId);
      
      if (apiResponse) {
        const processed = processTweetData(apiResponse, url);
        processedData.push(processed);
        console.log(`✓ Successfully processed: ${processed.authorHandle} - ${processed.articleTitle.substring(0, 50)}...`);
      } else {
        errors.push(`Failed to fetch: ${url}`);
      }
    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      errors.push(`Error processing: ${url}`);
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\nProcessing complete:`);
  console.log(`- Successfully processed: ${processedData.length}`);
  console.log(`- Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  if (processedData.length > 0) {
    console.log('\nSaving to Supabase...');
    await saveToSupabase(processedData);
    console.log('✓ All data saved to Supabase successfully!');
  }
}

// Run the script
if (require.main === module) {
  processAllTweets().catch(console.error);
}

export { processAllTweets };
export type { ProcessedTweetData };
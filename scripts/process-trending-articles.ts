#!/usr/bin/env npx tsx
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createServiceClient } from '../lib/supabase/service';
import { generateArticleAnalysis } from '../lib/deepseek';

// Tweet IDs from the trending list
const TRENDING_TWEETS = [
  { tweetId: '2015052151475876322', handle: 'Jumpei_Mitsui' },
  { tweetId: '2012220254504530043', handle: 'IterIntellectus' },
  { tweetId: '2015784327213183053', handle: 'suisuiayaka' },
  { tweetId: '2015039710180290599', handle: 'yoppymodel' },
  { tweetId: '2015118722558820705', handle: 'thatsKAIZEN' },
  { tweetId: '2012608685462220879', handle: 'KobeissiLetter' },
  { tweetId: '2013552215097778231', handle: 'Tim_Denning' },
  { tweetId: '2015709513903677634', handle: 'CuteCreatureCli' },
  { tweetId: '2014197314571952167', handle: 'Harrris0n' },
  { tweetId: '2012956603297964167', handle: 'thedankoe' },
  { tweetId: '2013770315692990853', handle: 'james_riney' },
  { tweetId: '2015956732980449686', handle: 'Darkside_of_NHK' },
  { tweetId: '2014020848089223440', handle: 'DylanCalluy' },
  { tweetId: '2015636441611510195', handle: 'hongkongdoll' },
  { tweetId: '2013915763485327436', handle: 'namikishida' },
  { tweetId: '2011957172821737574', handle: 'XCreators' },
  { tweetId: '2014337216814706989', handle: 'ryanhallyall' },
  { tweetId: '2015581711896395792', handle: 'satakeshunsuke' },
  { tweetId: '2014317062470980077', handle: 'elnathan_john' },
  { tweetId: '2013768012642349120', handle: 'wolfejosh' },
  { tweetId: '2013310977467429118', handle: 'poptime' },
  { tweetId: '2017187519272829088', handle: 'sujingshen' },
];

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';

// Interfaces for Twitter API response
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
  title?: string;
  [key: string]: unknown;
}

interface CoverMedia {
  media_info?: {
    original_img_url?: string;
  };
  [key: string]: unknown;
}

interface ExtendedArticleResult extends ArticleResult {
  cover_media?: CoverMedia;
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

interface ArticleData {
  title: string;
  author_name: string;
  image?: string;
  author_handle: string;
  author_avatar?: string;
  article_published_at: string;
  article_url: string;
  updated_at: string;
  tweet_id: string;
  tweet_text: string;
  tweet_published_at: string;
  tweet_views?: number;
  tweet_replies?: number;
  tweet_likes?: number;
  full_article_content?: string;
}

// Extract full article content from article result
function extractFullArticleContent(articleResult: ArticleResult): string {
  try {
    if (articleResult?.content_state?.blocks && Array.isArray(articleResult.content_state.blocks)) {
      const textBlocks = articleResult.content_state.blocks
        .filter((block: ContentBlock) => block.text && block.text.trim())
        .map((block: ContentBlock) => block.text!.trim());

      if (textBlocks.length > 0) {
        return textBlocks.join('\n\n');
      }
    }

    if (articleResult?.content?.blocks && Array.isArray(articleResult.content.blocks)) {
      const textBlocks = articleResult.content.blocks
        .filter((block: ContentBlock) => block.text && block.text.trim())
        .map((block: ContentBlock) => block.text!.trim());

      if (textBlocks.length > 0) {
        return textBlocks.join('\n\n');
      }
    }

    return articleResult?.preview_text || articleResult?.description || '';
  } catch (error) {
    console.error('Error extracting full article content:', error);
    return articleResult?.preview_text || articleResult?.description || '';
  }
}

// Fetch tweet details from RapidAPI
async function fetchTweetDetails(tweetId: string, retries: number = 3): Promise<TweetApiResponse | null> {
  console.log(`  Fetching tweet details for ${tweetId}...`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `https://${RAPIDAPI_HOST}/tweet?pid=${tweetId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      });

      if (response.status === 404) {
        console.log(`  Tweet ${tweetId} not found (404)`);
        return null;
      }

      if (response.status === 429) {
        console.log(`  Rate limited, waiting ${attempt * 5} seconds...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 5000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`  Attempt ${attempt}/${retries} failed:`, error);
      if (attempt === retries) return null;
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
  return null;
}

// Process tweet and extract article data
async function processTweetForArticle(tweetId: string, authorHandle: string): Promise<ArticleData | null> {
  const data = await fetchTweetDetails(tweetId);

  if (!data || !data.data || !data.data.threaded_conversation_with_injections_v2) {
    console.log(`  No data found for tweet ${tweetId}`);
    return null;
  }

  const instructions = data.data.threaded_conversation_with_injections_v2.instructions;
  if (!instructions || instructions.length === 0) {
    console.log(`  No instructions found for tweet ${tweetId}`);
    return null;
  }

  let tweetResult: TweetResult | null = null;

  for (const instruction of instructions) {
    if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
      for (const entry of instruction.entries) {
        if (entry.content?.itemContent?.tweet_results?.result) {
          tweetResult = entry.content.itemContent.tweet_results.result;
          break;
        }
      }
      if (tweetResult) break;
    }
  }

  if (!tweetResult) {
    console.log(`  No tweet result found for ${tweetId}`);
    return null;
  }

  const legacy = tweetResult.legacy;
  const userResult = tweetResult.core?.user_results?.result;
  const userLegacy = userResult?.legacy;

  if (!legacy) {
    console.log(`  No legacy data found for ${tweetId}`);
    return null;
  }

  // Check for article data in the tweet
  const articleResult = tweetResult.article_results?.result || tweetResult.article?.article_results?.result;

  if (!articleResult) {
    console.log(`  No article data found for tweet ${tweetId}`);
    return null;
  }

  const extendedArticleResult = articleResult as ExtendedArticleResult;

  const tweetText = legacy.full_text || legacy.text || 'No content available';
  const title = extendedArticleResult.title || tweetText.substring(0, 100) || 'Untitled Article';
  const excerpt = extendedArticleResult.preview_text || extendedArticleResult.description || tweetText.substring(0, 200);
  const featuredImageUrl = extendedArticleResult.cover_media?.media_info?.original_img_url;

  const fullArticleContent = extractFullArticleContent(extendedArticleResult);

  console.log(`  Extracted: ${title.substring(0, 50)}... (${fullArticleContent.length} chars)`);

  return {
    title,
    author_name: userLegacy?.name || authorHandle,
    image: featuredImageUrl || legacy.entities?.media?.[0]?.media_url_https,
    author_handle: authorHandle,
    author_avatar: userLegacy?.profile_image_url_https,
    article_published_at: new Date(legacy.created_at || Date.now()).toISOString(),
    article_url: `https://x.com/${authorHandle}/status/${tweetId}`,
    updated_at: new Date().toISOString(),
    tweet_id: tweetId,
    tweet_text: tweetText,
    tweet_published_at: new Date(legacy.created_at || Date.now()).toISOString(),
    tweet_views: tweetResult.views?.count || 0,
    tweet_replies: legacy.reply_count || 0,
    tweet_likes: legacy.favorite_count || 0,
    full_article_content: fullArticleContent || excerpt || title,
  };
}

// Insert article into Supabase
async function insertArticle(article: ArticleData, supabase: any): Promise<boolean> {
  try {
    // Check if article already exists
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id')
      .eq('tweet_id', article.tweet_id)
      .maybeSingle();

    if (existingArticle) {
      console.log(`  Article already exists, updating...`);
      const { error } = await supabase
        .from('articles')
        .update(article)
        .eq('tweet_id', article.tweet_id);
      return !error;
    }

    // Insert new article
    const { error } = await supabase
      .from('articles')
      .insert([article]);

    if (error) {
      console.error(`  Insert error:`, error.message);
      return false;
    }

    console.log(`  ✓ Inserted new article`);
    return true;
  } catch (error) {
    console.error(`  Failed to save article:`, error);
    return false;
  }
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

async function main() {
  const supabase = createServiceClient();

  console.log('='.repeat(60));
  console.log('Checking which trending articles are already in database...');
  console.log('='.repeat(60));

  // Check which articles already exist
  const existingArticles: Array<{ tweetId: string; title: string; summary: boolean; score: number; indexed: boolean }> = [];
  const missingArticles: Array<{ tweetId: string; handle: string }> = [];

  for (const { tweetId, handle } of TRENDING_TWEETS) {
    const { data } = await supabase
      .from('articles')
      .select('id, title, summary_english, score, indexed')
      .eq('tweet_id', tweetId)
      .maybeSingle();

    if (data) {
      existingArticles.push({
        tweetId,
        title: data.title?.substring(0, 60) || '',
        summary: !!data.summary_english,
        score: data.score || 0,
        indexed: data.indexed || false
      });
    } else {
      missingArticles.push({ tweetId, handle });
    }
  }

  console.log('\n=== EXISTING ARTICLES ===');
  for (const article of existingArticles) {
    console.log(`✓ ${article.tweetId}: ${article.title}`);
    console.log(`  Summary: ${article.summary ? 'Yes' : 'No'}, Score: ${article.score}, Indexed: ${article.indexed}`);
  }

  console.log('\n=== MISSING ARTICLES ===');
  for (const article of missingArticles) {
    console.log(`✗ ${article.tweetId} (@${article.handle})`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Summary: ${existingArticles.length} existing, ${missingArticles.length} missing`);
  console.log('='.repeat(60));

  if (missingArticles.length === 0) {
    console.log('\nAll articles are already in the database!');
    return;
  }

  // Process missing articles
  console.log('\n=== PROCESSING MISSING ARTICLES ===\n');

  for (const { tweetId, handle } of missingArticles) {
    console.log(`\n--- Processing ${tweetId} (@${handle}) ---`);

    try {
      // Fetch and insert the article
      const articleData = await processTweetForArticle(tweetId, handle);

      if (!articleData) {
        console.log(`✗ Failed to extract article data`);
        continue;
      }

      // Generate slug
      const slug = generateSlug(articleData.title);
      const articleWithSlug = { ...articleData, slug };

      const insertSuccess = await insertArticle(articleWithSlug, supabase);

      if (!insertSuccess) {
        console.log(`✗ Failed to insert article`);
        continue;
      }

      // Wait before DeepSeek processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate summary and analysis with DeepSeek
      const content = articleData.full_article_content || articleData.tweet_text || '';
      if (content.length > 50) {
        console.log(`  Running DeepSeek analysis...`);
        const analysis = await generateArticleAnalysis(content, articleData.title);

        // Update article with DeepSeek results
        const updateData: any = {
          summary_chinese: analysis.summary.chinese,
          summary_english: analysis.summary.english,
          language: analysis.language,
          summary_generated_at: new Date().toISOString(),
        };

        if (analysis.title_english && analysis.title_english !== articleData.title) {
          updateData.title_english = analysis.title_english;
        }

        // Calculate score - base of 75 for trending articles, adjusted by engagement
        const engagementScore = Math.min(
          25,
          (articleData.tweet_likes || 0) * 0.001 +
          (articleData.tweet_replies || 0) * 0.005 +
          (articleData.tweet_views || 0) * 0.00001
        );
        updateData.score = Math.min(100, 75 + engagementScore);
        updateData.indexed = true; // Mark for trending page

        const { error: updateError } = await supabase
          .from('articles')
          .update(updateData)
          .eq('tweet_id', tweetId);

        if (updateError) {
          console.log(`  ⚠ Update error: ${updateError.message}`);
        } else {
          console.log(`  ✓ DeepSeek complete`);
          console.log(`    - EN Title: ${analysis.title_english?.substring(0, 50)}...`);
          console.log(`    - Score: ${updateData.score.toFixed(1)}`);
        }
      }

    } catch (error) {
      console.error(`✗ Error:`, error);
    }

    // Delay between articles
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('Processing complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);

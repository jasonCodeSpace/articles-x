import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TweetLink {
  tweetId: string;
  url: string;
}

async function insertTweetIds() {
  try {
    // Read the extracted tweet IDs
    const filePath = path.join(process.cwd(), 'extracted-tweet-ids.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const tweetData: TweetLink[] = JSON.parse(fileContent);
    
    console.log(`Found ${tweetData.length} tweet IDs to insert`);
    
    // Prepare data for insertion
    const tweetsToInsert = tweetData.map(tweet => ({
      tweet_id: tweet.tweetId,
      is_article: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Insert in batches of 100 to avoid hitting limits
    const batchSize = 100;
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < tweetsToInsert.length; i += batchSize) {
      const batch = tweetsToInsert.slice(i, i + batchSize);
      
      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tweetsToInsert.length / batchSize)}...`);
      
      // Use upsert to handle duplicates gracefully
      const { data, error } = await supabase
        .from('tweets')
        .upsert(batch, {
          onConflict: 'tweet_id',
          ignoreDuplicates: false
        })
        .select('tweet_id');
      
      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        continue;
      }
      
      const batchInserted = data?.length || 0;
      insertedCount += batchInserted;
      skippedCount += batch.length - batchInserted;
      
      console.log(`Batch ${Math.floor(i / batchSize) + 1} completed: ${batchInserted} inserted`);
      
      // Add small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n=== INSERTION SUMMARY ===');
    console.log(`Total tweets processed: ${tweetData.length}`);
    console.log(`Successfully inserted: ${insertedCount}`);
    console.log(`Skipped (duplicates): ${skippedCount}`);
    console.log('\nTweet IDs have been inserted into the tweets table.');
    console.log('You can now run the process-articles API to fetch article details.');
    
  } catch (error) {
    console.error('Error inserting tweet IDs:', error);
    process.exit(1);
  }
}

// Run the insertion
insertTweetIds();

export { insertTweetIds };
export type { TweetLink };
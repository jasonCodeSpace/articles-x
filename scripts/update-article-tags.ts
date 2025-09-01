import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to calculate article tag based on publication date
function calculateArticleTag(publishedAt: string): 'Day' | 'Week' | 'History' {
  const now = new Date();
  const publishedDate = new Date(publishedAt);
  const timeDiff = now.getTime() - publishedDate.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  if (hoursDiff <= 24) {
    return 'Day';
  } else if (hoursDiff <= 24 * 7) {
    return 'Week';
  } else {
    return 'History';
  }
}

// Function to update article tags
async function updateArticleTags(): Promise<void> {
  try {
    console.log('Starting article tag update process...');
    
    // Get articles from the last 8 days that need tag updates
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, article_published_at, tag')
      .gte('article_published_at', eightDaysAgo.toISOString())
      .order('article_published_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching articles:', error);
      return;
    }
    
    if (!articles || articles.length === 0) {
      console.log('No articles found to update');
      return;
    }
    
    console.log(`Found ${articles.length} articles to process`);
    
    let updatedCount = 0;
    
    for (const article of articles) {
      const newTag = calculateArticleTag(article.article_published_at);
      
      // Only update if the tag has changed
      if (article.tag !== newTag) {
        const { error: updateError } = await supabase
          .from('articles')
          .update({ tag: newTag })
          .eq('id', article.id);
        
        if (updateError) {
          console.error(`Error updating article ${article.id}:`, updateError);
        } else {
          console.log(`Updated article ${article.id}: ${article.tag} -> ${newTag}`);
          updatedCount++;
        }
      }
    }
    
    console.log(`Article tag update completed. Updated ${updatedCount} articles.`);
    
  } catch (error) {
    console.error('Error in updateArticleTags:', error);
  }
}

// Main function
async function main(): Promise<void> {
  console.log('Update Article Tags - Starting...');
  
  try {
    await updateArticleTags();
    console.log('Update Article Tags - Completed successfully');
  } catch (error) {
    console.error('Update Article Tags - Failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { updateArticleTags };
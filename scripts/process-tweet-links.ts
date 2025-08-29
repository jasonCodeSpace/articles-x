import fs from 'fs';
import path from 'path';

interface TweetLink {
  url: string;
  tweetId: string;
}

/**
 * Extract tweet ID from X/Twitter URL
 * @param url - The tweet URL
 * @returns The tweet ID or null if not found
 */
function extractTweetId(url: string): string | null {
  const match = url.match(/\/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Parse the all-tweet-links.txt file and extract first 500 tweet links
 * @param filePath - Path to the tweet links file
 * @param limit - Maximum number of tweets to extract (default: 500)
 * @returns Array of tweet links with IDs
 */
function parseTweetLinks(filePath: string, limit: number = 500): TweetLink[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const tweetLinks: TweetLink[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and lines that don't contain URLs
      if (!trimmedLine || !trimmedLine.includes('https://x.com/')) {
        continue;
      }
      
      // Extract tweet ID from URL
      const tweetId = extractTweetId(trimmedLine);
      if (tweetId) {
        tweetLinks.push({
          url: trimmedLine,
          tweetId: tweetId
        });
        
        // Stop when we reach the limit
        if (tweetLinks.length >= limit) {
          break;
        }
      }
    }
    
    return tweetLinks;
  } catch (error) {
    console.error('Error reading tweet links file:', error);
    return [];
  }
}

/**
 * Main function to process tweet links
 */
async function main() {
  const tweetLinksPath = path.join(process.cwd(), 'all-tweet-links.txt');
  
  console.log('Parsing tweet links from:', tweetLinksPath);
  
  const tweetLinks = parseTweetLinks(tweetLinksPath, 500);
  
  console.log(`Found ${tweetLinks.length} tweet links`);
  
  // Save the extracted tweet IDs to a JSON file for further processing
  const outputPath = path.join(process.cwd(), 'extracted-tweet-ids.json');
  fs.writeFileSync(outputPath, JSON.stringify(tweetLinks, null, 2));
  
  console.log(`Tweet IDs saved to: ${outputPath}`);
  
  // Display first 10 for verification
  console.log('\nFirst 10 tweet links:');
  tweetLinks.slice(0, 10).forEach((link, index) => {
    console.log(`${index + 1}. ID: ${link.tweetId} - URL: ${link.url}`);
  });
}

if (require.main === module) {
  main().catch(console.error);
}

export { parseTweetLinks, extractTweetId };
export type { TweetLink };
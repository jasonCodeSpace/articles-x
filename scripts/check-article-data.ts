import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const tweetId = '1948019311752151066';
const username = 'elonmusk';
const tweetUrl = `https://x.com/${username}/status/${tweetId}`;

async function checkArticleData() {
  try {
    const apiUrl = `https://twitter.com/i/api/graphql/VWxGj2thgNAJlv_REjq3oa/TweetDetail?variables=%7B%22focalTweetId%22%3A%22${tweetId}%22%2C%22with_rux_injections%22%3Afalse%2C%22includePromotedContent%22%3Atrue%2C%22withCommunity%22%3Atrue%2C%22withQuickPromoteEligibilityTweetFields%22%3Atrue%2C%22withBirdwatchNotes%22%3Atrue%2C%22withVoice%22%3Atrue%2C%22withV2Timeline%22%3Atrue%7D&features=%7B%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Atrue%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22creator_subscriptions_quote_tweet_preview_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22rweb_video_timestamps_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D&fieldToggles=%7B%22withArticleRichContentState%22%3Atrue%2C%22withArticlePlainText%22%3Afalse%2C%22withGrokAnalyze%22%3Afalse%2C%22withDisallowedReplyControls%22%3Afalse%7D`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return;
    }

    const data = await response.json();
    const instructions = data.data?.threaded_conversation_with_injections_v2?.instructions || [];
    
    let tweetResult = null;
    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
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

    if (tweetResult) {
      console.log('Tweet result found!');
      console.log('Has article_results:', !!tweetResult.article_results);
      console.log('Has article:', !!tweetResult.article);
      
      if (tweetResult.article_results) {
        console.log('article_results:', JSON.stringify(tweetResult.article_results, null, 2));
      }
      
      if (tweetResult.article) {
        console.log('article:', JSON.stringify(tweetResult.article, null, 2));
      }
      
      // Check for URLs in entities
      const legacy = tweetResult.legacy;
      if (legacy?.entities?.urls) {
        console.log('URLs found in entities:');
        legacy.entities.urls.forEach((url: any, index: number) => {
          console.log(`  URL ${index}:`, {
            url: url.url,
            expanded_url: url.expanded_url,
            display_url: url.display_url
          });
        });
      }
    } else {
      console.log('No tweet result found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkArticleData();
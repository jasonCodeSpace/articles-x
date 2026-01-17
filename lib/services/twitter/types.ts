import { z } from 'zod'

// Zod schemas for Twitter API response validation

const TwitterUserSchema = z.object({
  id_str: z.string().optional(),
  rest_id: z.string().optional(),
  screen_name: z.string().optional(),
  name: z.string().optional(),
  profile_image_url_https: z.string().optional(),
  following: z.boolean().optional(),
  can_dm: z.boolean().optional(),
  can_media_tag: z.boolean().optional(),
  created_at: z.string().optional(),
  default_profile: z.boolean().optional(),
  default_profile_image: z.boolean().optional(),
  description: z.string().optional(),
  entities: z.object({
    description: z.object({
      urls: z.array(z.any()).optional(),
    }).optional(),
  }).optional(),
  fast_followers_count: z.number().optional(),
  favourites_count: z.number().optional(),
  followers_count: z.number().optional(),
  friends_count: z.number().optional(),
  has_custom_timelines: z.boolean().optional(),
  is_translator: z.boolean().optional(),
  listed_count: z.number().optional(),
  location: z.string().optional(),
  media_count: z.number().optional(),
  normal_followers_count: z.number().optional(),
  pinned_tweet_ids_str: z.array(z.string()).optional(),
  possibly_sensitive: z.boolean().optional(),
  profile_banner_url: z.string().optional(),
  profile_interstitial_type: z.string().optional(),
  statuses_count: z.number().optional(),
  translator_type: z.string().optional(),
  verified: z.boolean().optional(),
  want_retweets: z.boolean().optional(),
  withheld_in_countries: z.array(z.string()).optional(),
})

const ArticleResultSchema = z.object({
  result: z.object({
    rest_id: z.string(),
    id: z.string().optional(),
    title: z.string().optional(),
    preview_text: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    content: z.string().optional(),
    content_state: z.object({
      blocks: z.array(z.object({
        text: z.string().optional(),
        type: z.string().optional(),
        key: z.string().optional(),
        data: z.unknown().optional(),
        entityRanges: z.array(z.unknown()).optional(),
        inlineStyleRanges: z.array(z.unknown()).optional(),
        depth: z.number().optional(),
      })).optional(),
      entityMap: z.unknown().optional(),
    }).optional(),
    cover_media: z.object({
      media_info: z.object({
        original_img_url: z.string().optional(),
      }).optional(),
    }).optional(),
    lifecycle_state: z.object({
      modified_at_secs: z.number().optional(),
    }).optional(),
    metadata: z.object({
      first_published_at_secs: z.number().optional(),
    }).optional(),
  }).optional(),
}).optional()

const TweetLegacySchema = z.object({
  id_str: z.string(),
  full_text: z.string().optional(),
  text: z.string().optional(),
  created_at: z.string(),
  user: TwitterUserSchema.optional(),
  user_id_str: z.string().optional(),
  reply_count: z.number().optional(),
  retweet_count: z.number().optional(),
  favorite_count: z.number().optional(),
  quote_count: z.number().optional(),
  bookmark_count: z.number().optional(),
  retweeted: z.boolean().optional(),
  lang: z.string().optional(),
  possibly_sensitive: z.boolean().optional(),
  in_reply_to_status_id_str: z.string().optional(),
  in_reply_to_user_id_str: z.string().optional(),
  in_reply_to_screen_name: z.string().optional(),
  quoted_status_id_str: z.string().optional(),
  quoted_status_permalink: z.object({
    url: z.string().optional(),
    expanded: z.string().optional(),
    display: z.string().optional(),
  }).optional(),
  entities: z.object({
    hashtags: z.array(z.object({
      text: z.string(),
      indices: z.array(z.number()),
    })).optional(),
    urls: z.array(z.object({
      url: z.string(),
      expanded_url: z.string().optional(),
      display_url: z.string().optional(),
      indices: z.array(z.number()).optional(),
    })).optional(),
    user_mentions: z.array(z.object({
      screen_name: z.string(),
      name: z.string(),
      id_str: z.string(),
      indices: z.array(z.number()),
    })).optional(),
    media: z.array(z.object({
      id_str: z.string(),
      media_url_https: z.string(),
      url: z.string(),
      display_url: z.string().optional(),
      expanded_url: z.string().optional(),
      type: z.string(),
      sizes: z.record(z.string(), z.object({
        w: z.number(),
        h: z.number(),
        resize: z.string(),
      })).optional(),
    })).optional(),
  }).optional(),
})

export const TweetSchema = z.object({
  __typename: z.string().optional(),
  rest_id: z.string().optional(),
  core: z.object({
    user_results: z.object({
      result: z.object({
        __typename: z.string().optional(),
        id: z.string().optional(),
        rest_id: z.string().optional(),
        affiliates_highlighted_label: z.object({}).optional(),
        has_graduated_access: z.boolean().optional(),
        is_blue_verified: z.boolean().optional(),
        profile_image_shape: z.string().optional(),
        legacy: TwitterUserSchema.optional(),
        core: z.object({
          created_at: z.string().optional(),
          name: z.string().optional(),
          screen_name: z.string().optional(),
        }).optional(),
        avatar: z.object({
          image_url: z.string().optional(),
        }).optional(),
        tipjar_settings: z.object({
          is_enabled: z.boolean().optional(),
          bitcoin_handle: z.string().optional(),
          ethereum_handle: z.string().optional(),
        }).optional(),
      }),
    }).optional(),
  }).optional(),
  legacy: TweetLegacySchema.optional(),
  views: z.object({
    count: z.string().optional(),
  }).optional(),
  article: z.object({
    article_results: ArticleResultSchema,
  }).optional(),
  article_results: ArticleResultSchema,
})

export const TimelineResponseSchema = z.object({
  cursor: z.union([z.string(), z.object({}).passthrough()]).optional(),
  result: z.object({
    timeline: z.object({
      instructions: z.array(z.object({
        type: z.string().optional(),
        entries: z.array(z.object({
          entryId: z.string(),
          sortIndex: z.string().optional(),
          content: z.union([
            z.object({
              entryType: z.literal('TimelineTimelineItem'),
              __typename: z.string().optional(),
              itemContent: z.object({
                itemType: z.literal('TimelineTweet'),
                tweet_results: z.object({
                  result: TweetSchema,
                }),
              }),
            }),
            z.object({
              entryType: z.literal('TimelineTimelineCursor'),
              __typename: z.string().optional(),
              value: z.string(),
              cursorType: z.string(),
            }),
            z.object({}).passthrough(),
          ]),
        })),
      })),
    }),
  }),
})

// Type exports
export type TwitterTimelineResponse = z.infer<typeof TimelineResponseSchema>
export type TwitterTweet = z.infer<typeof TweetSchema>

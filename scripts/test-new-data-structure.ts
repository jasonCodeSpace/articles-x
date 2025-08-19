import { mapTweetToArticle } from '../lib/ingest'

// Test data based on your provided example
const testTweetData = {
  "__typename": "Tweet",
  "rest_id": "1951693447770902832",
  "core": {
    "user_results": {
      "result": {
        "__typename": "User",
        "id": "VXNlcjoxNDYyMTM0MTkzMjI0MzA2NzA0",
        "rest_id": "1462134193224306704",
        "legacy": {
          "following": false,
          "can_dm": true,
          "can_media_tag": false,
          "created_at": "Sat Nov 20 19:02:19 +0000 2021",
          "default_profile": true,
          "default_profile_image": false,
          "description": "retired, goodbye",
          "screen_name": "MiyaHedge",
          "name": "miya",
          "profile_image_url_https": "https://pbs.twimg.com/profile_images/1931632129470844928/aa2EzV-D_normal.jpg"
        }
      }
    }
  },
  "legacy": {
    "bookmark_count": 639,
    "bookmarked": false,
    "created_at": "Sat Aug 02 17:15:53 +0000 2025",
    "conversation_id_str": "1951693447770902832",
    "display_text_range": [0, 23],
    "full_text": "https://t.co/qK8HW1rrXi",
    "id_str": "1951693447770902832"
  },
  "article": {
    "article_results": {
      "result": {
        "rest_id": "1951672267450052608",
        "id": "QXJ0aWNsZUVudGl0eToxOTUxNjcyMjY3NDUwMDUyNjA4",
        "title": "PumpFun is winning.",
        "preview_text": "First of all, this is not an attack on LetsBonk; I think the Bonk team, led by Tom, did a fantastic job of winning over memecoin mindshare to the degree that a counterattack is not worth it. LetsBonk",
        "cover_media": {
          "id": "QXBpTWVkaWE6DAAFCgABGxXN2RLWcAAKAAIUSotNURZQEAAA",
          "media_key": "3_1951692345742618624",
          "media_id": "1951692345742618624",
          "media_info": {
            "__typename": "ApiImage",
            "original_img_height": 282,
            "original_img_width": 705,
            "original_img_url": "https://pbs.twimg.com/media/GxXN2RLWcAAmv-A.jpg"
          }
        },
        "lifecycle_state": {
          "modified_at_secs": 1754155879
        },
        "metadata": {
          "first_published_at_secs": 1754154953
        }
      }
    }
  }
}

// Test tweet without article field (should be skipped)
const testTweetWithoutArticle = {
  "__typename": "Tweet",
  "rest_id": "1951704775025918176",
  "core": {
    "user_results": {
      "result": {
        "__typename": "User",
        "legacy": {
          "screen_name": "MiyaHedge",
          "name": "miya"
        }
      }
    }
  },
  "legacy": {
    "created_at": "Sat Aug 02 18:00:53 +0000 2025",
    "full_text": "this is not intended to be a long signal btw, i think it's very clear laid out that pumpfun will",
    "id_str": "1951704775025918176"
  }
  // No article field - should be skipped
}

console.log('Testing tweet with article field:')
const result1 = mapTweetToArticle(testTweetData as any)
console.log('Result:', result1)

console.log('\nTesting tweet without article field:')
const result2 = mapTweetToArticle(testTweetWithoutArticle as any)
console.log('Result (should be null):', result2)

console.log('\nTest completed!')
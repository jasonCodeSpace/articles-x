#!/usr/bin/env tsx
/**
 * Fetch OmarExplains article
 */

import { createClient } from '@supabase/supabase-js'
import { createTwitterClient } from '@/lib/services/twitter/client'
import { mapTweetToArticle } from '@/lib/services/article/mapper'
import { batchUpsertArticles } from '@/lib/services/article'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const client = createTwitterClient()
  const tweetId = '2013213200934723977'

  console.log('=== Fetching OmarExplains Article ===\n')
  console.log(`Fetching ${tweetId}...`)

  try {
    const tweet = await client.fetchTweet(tweetId)

    if (!tweet) {
      console.log('Tweet not found or error')
      return
    }

    const article = mapTweetToArticle(tweet)

    if (article) {
      const wordCount = article.full_article_content?.split(/\s+/).length || 0
      console.log(`✓ ${article.title}`)
      console.log(`  词数: ${wordCount}`)

      console.log('\n=== Saving to database ===')
      const result = await batchUpsertArticles([article])
      console.log(`Result: ${result.inserted} inserted, ${result.updated} updated`)

      // Generate summary
      if (result.inserted > 0 || result.updated > 0) {
        console.log('\n=== Generating summary ===')
        const { generateEnglishAnalysis, translateToChinese } = await import('@/lib/deepseek')
        const { isEnglish } = await import('@/lib/url-utils')
        const { countWords, getSummaryRequirement } = await import('@/lib/word-count')

        const content = article.full_article_content || article.title
        const wordCount2 = countWords(content)
        const requirement = getSummaryRequirement(wordCount2)

        if (!requirement.shouldSkip) {
          const needsTitleTranslation = !isEnglish(article.title)
          const englishResult = await generateEnglishAnalysis(content, article.title, needsTitleTranslation)
          const summaryChinese = await translateToChinese(englishResult.summary_english)

          // Get the article ID
          const { data: articleData } = await supabase
            .from('articles')
            .select('id')
            .eq('tweet_id', tweetId)
            .single()

          if (articleData) {
            await supabase
              .from('articles')
              .update({
                summary_english: englishResult.summary_english,
                summary_chinese: summaryChinese,
                summary_zh: summaryChinese,
                summary_en: englishResult.summary_english,
                title_english: needsTitleTranslation ? englishResult.title_english : article.title,
                language: needsTitleTranslation ? 'zh' : 'en',
                summary_generated_at: new Date().toISOString()
              })
              .eq('id', articleData.id)

            console.log('✓ Summary generated')
          }
        } else {
          console.log('⏭ Skipped summary (content too short)')
        }
      }
    } else {
      console.log('No article content found in tweet')
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
  }
}

main().catch(console.error)

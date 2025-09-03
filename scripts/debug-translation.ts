#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { generateArticleAnalysis } from '@/lib/gemini'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function debugTranslation() {
  console.log('🔍 Debug Translation Issue...')
  
  // Get one article that has empty article_preview_text_english
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, full_article_content, article_preview_text, article_preview_text_english')
    .or('article_preview_text_english.is.null,article_preview_text_english.eq.')
    .limit(1)
  
  if (error) {
    console.error('Error fetching articles:', error)
    return
  }
  
  if (!articles || articles.length === 0) {
    console.log('No articles found with empty english preview text')
    return
  }
  
  const article = articles[0]
  console.log(`\n📄 Testing article: ${article.title}`)
  console.log(`   ID: ${article.id}`)
  console.log(`   Current preview (original): ${article.article_preview_text?.substring(0, 100)}...`)
  console.log(`   Current preview (english): ${article.article_preview_text_english || 'EMPTY'}`)
  
  try {
    console.log('\n🤖 Calling AI for analysis...')
    
    // Let's also call the AI directly to see the raw response
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const prompt = `You are an expert content analyst. Analyze the following article and provide a structured response.

ENGLISH_TRANSLATION: [ALWAYS provide this section regardless of original language]
TITLE: [English translation or original if already in English - NEVER use "Not provided", "Not available", etc.]
TWEET_TEXT: [English translation or original if already in English - NEVER use "Not provided", "Not available", etc.]
PREVIEW_TEXT: [English translation or original if already in English - NEVER use "Not provided", "Not available", etc.]
FULL_CONTENT: [English translation or original if already in English - NEVER use "Not provided", "Not available", etc.]

Article Title: ${article.title}

Article Content:
${(article.full_article_content || '').substring(0, 2000)}`
    
    console.log('\n📝 Raw AI Prompt:')
    console.log(prompt.substring(0, 500) + '...')
    
    const result = await model.generateContent(prompt)
    const rawResponse = await result.response.text()
    
    console.log('\n🤖 Raw AI Response:')
    console.log('================================================================================')    
    console.log(rawResponse)
    console.log('================================================================================')
    
    // Check if ENGLISH_TRANSLATION section exists in raw response
    if (rawResponse.includes('ENGLISH_TRANSLATION:')) {
      console.log('\n✅ ENGLISH_TRANSLATION section found in raw response!')
      const translationMatch = rawResponse.match(/ENGLISH_TRANSLATION:[\s\S]*$/i)
      if (translationMatch) {
        console.log('\n📝 Raw Translation Section:')
        console.log(translationMatch[0])
      }
    } else {
      console.log('\n❌ ENGLISH_TRANSLATION section NOT found in raw response!')
    }
    console.log('================================================================================')
    
    const analysis = await generateArticleAnalysis(
      article.full_article_content || '',
      article.title
    )
    
    console.log('\n📊 AI Analysis Result:')
    console.log(`   Language: ${analysis.language}`)
    console.log(`   Category: ${analysis.category}`)
    console.log(`   Summary: ${analysis.summary}`)
    
    if (analysis.summary) {
       console.log('\n📝 Article Summary:')
       console.log(`   Chinese: ${analysis.summary.chinese.substring(0, 100)}...`)
       console.log(`   English: ${analysis.summary.english.substring(0, 100)}...`)
      
      // Debug the parsing
       console.log('\n🔍 Debug Parsing:')
       console.log('   Raw response contains ENGLISH_TRANSLATION:', rawResponse.includes('ENGLISH_TRANSLATION:'))
       
       if (rawResponse.includes('ENGLISH_TRANSLATION:')) {
         const translationMatch = rawResponse.match(/ENGLISH_TRANSLATION:[\s\S]*$/i)
         console.log('   Translation match found:', !!translationMatch)
         
         if (translationMatch) {
           const translationText = translationMatch[0]
           console.log('   Translation text length:', translationText.length)
           
           const tweetMatch = translationText.match(/\*\*TWEET_TEXT:\*\*\s*([^\n]+)/i) || translationText.match(/TWEET_TEXT:\s*([^\n]+)/i)
            console.log('   Tweet match result:', tweetMatch ? tweetMatch[1] : 'NO MATCH')
            
            const previewMatch = translationText.match(/\*\*PREVIEW_TEXT:\*\*\s*([^\n]+)/i) || translationText.match(/PREVIEW_TEXT:\s*([^\n]+)/i)
            console.log('   Preview match result:', previewMatch ? previewMatch[1] : 'NO MATCH')
            
            // Test isValidTranslation function
            const isValidTranslation = (text: string): boolean => {
              const invalidValues = [
                'not applicable', 'not stated', 'n/a', 'na', 'none', 'null', 'undefined',
                'not provided', 'not available', 'no translation', 'no content',
                'not specified', 'not mentioned', 'not given', 'not found',
                'unavailable', 'missing', 'empty', 'blank', 'not applicable',
                'not translated', 'original text', 'same as original'
              ];
              return Boolean(text) && 
                     text.trim().length > 0 && 
                     !invalidValues.includes(text.toLowerCase().trim()) &&
                     !text.toLowerCase().includes('not provided') &&
                     !text.toLowerCase().includes('not available');
            };
            
            if (tweetMatch) {
              const tweetText = tweetMatch[1].trim();
              console.log('   Tweet isValid:', isValidTranslation(tweetText), 'Text:', tweetText);
            }
            
            if (previewMatch) {
              const previewText = previewMatch[1].trim();
              console.log('   Preview isValid:', isValidTranslation(previewText), 'Text:', previewText);
            }
         }
       } else {
         console.log('   ❌ ENGLISH_TRANSLATION section NOT found in raw response!')
       }
      
      // Check if summary is complete
      if (!analysis.summary.chinese || !analysis.summary.english) {
        console.log('\n❌ ISSUE FOUND: Incomplete summary in AI response')
      } else {
        console.log('\n✅ Summary is complete in AI response')
      }
    } else {
      console.log('\n❌ ISSUE FOUND: No summary in AI response')
    }
    
  } catch (error) {
    console.error('\n💥 Error during AI analysis:', error)
  }
}

async function main() {
  try {
    await debugTranslation()
  } catch (error) {
    console.error('Script error:', error)
    process.exit(1)
  }
}

main()
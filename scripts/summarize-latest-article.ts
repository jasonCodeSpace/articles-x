#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY!;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

async function loadPromptTemplate(): Promise<string> {
  const promptPath = path.join(__dirname, '../prompts/source-faithful-summarizer.xml');
  return fs.readFileSync(promptPath, 'utf-8');
}

async function getArticlesFromMain(limit: number = 5) {
  const { data: articles, error } = await supabase
    .from('article_main')
    .select('id, title, article_preview_text, full_article_content, article_published_at')
    .not('full_article_content', 'is', null)
    .or('summary_english.is.null,title_english.is.null,article_preview_text_english.is.null,slug.is.null')
    .order('article_published_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Error fetching articles from article_main: ${error.message}`);
  }

  if (!articles || articles.length === 0) {
    throw new Error('No articles found that need summarization');
  }

  return articles;
}

async function translateTitle(title: string): Promise<string> {
  // If title is already in English (basic check), return as is
  if (/^[a-zA-Z0-9\s\.,!?"'\-:;()]+$/.test(title)) {
    return title;
  }
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Translate the following title to English ONLY. Output must be in English language only, no other languages allowed. Provide only the translated title, nothing else:\n\n${title}`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

async function translateText(text: string, type: string): Promise<string> {
  // If text is already in English (basic check), return as is
  if (/^[a-zA-Z0-9\s\.,!?"'\-:;()]+$/.test(text)) {
    return text;
  }
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  let prompt = '';
  
  if (type === 'title') {
    prompt = `Translate and optimize the following title for SEO while staying true to the article content. The SEO optimization is secondary to accuracy. Keep the English title concise and under 80 characters. Output must be in English language ONLY, no other languages allowed. Provide only the optimized English title, nothing else:\n\n${text}`;
  } else {
    prompt = `Translate the following ${type} to English ONLY. Output must be in English language only, no other languages allowed. Provide only the translated text, nothing else:\n\n${text}`;
  }
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

async function generateSummary(title: string, content: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // Create the actual prompt with engaging style
  const articleText = `Title: ${title}\n\nContent: ${content}`;
  const prompt = `
You are a professional English content writer. Your task is to create an engaging English summary.

CRITICAL REQUIREMENTS - MUST FOLLOW EXACTLY:
1. OUTPUT LANGUAGE: Write ONLY in English. No other languages allowed whatsoever.
2. LENGTH: Write exactly 280-320 words. Count your words carefully.
3. STRUCTURE: Write exactly 2-3 paragraphs. Each paragraph must be 90-120 words.
4. PARAGRAPH BREAKS: Use double line breaks (\n\n) between paragraphs.

STYLE REQUIREMENTS:
- Write in an engaging, immersive style that makes readers feel present
- ABSOLUTELY NEVER start with "The article", "This article", "The piece", "The story", "The report" or any similar phrases
- NEVER use third-person references to the article itself
- Start directly with the action, event, or main subject
- Use active voice and vivid language
- Create a sense of immediacy and relevance
- Make readers feel like they're experiencing the story firsthand
- Write as if describing events happening now or recently

CONTENT RULES:
- Strictly reflect only what the source states
- No new facts, opinions, or external context
- For disputed claims use: "reports suggest" or "claims emerge that"
- Keep any direct quote ≤ 15 words
- Preserve key numbers, names, and dates
- Include all key points and developments from the original content
- Maintain narrative flow between paragraphs

OUTPUT FORMAT EXAMPLE:
[First paragraph: 90-120 words about main topic/event]\n\n[Second paragraph: 90-120 words about key developments/details]\n\n[Third paragraph if needed: 90-120 words about implications/outcomes]

Input: ${articleText}

Write your 280-320 word English summary in 2-3 paragraphs now:
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

function generateSlug(titleEnglish: string, articleId: string): string {
  // Extract first 8 characters of UUID for brevity
  const shortUuid = articleId.substring(0, 8);
  
  // Clean and format the English title
  const cleanTitle = titleEnglish
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 40); // Limit title part to 40 characters
  
  // Combine title with short UUID
  return `${cleanTitle}-${shortUuid}`;
}

async function updateArticleTranslations(articleId: string, titleEnglish: string, previewEnglish: string, summary: string, slug: string) {
  const { error } = await supabase
    .from('article_main')
    .update({ 
      title_english: titleEnglish,
      article_preview_text_english: previewEnglish,
      summary_english: summary,
      slug: slug
    })
    .eq('id', articleId);

  if (error) {
    throw new Error(`Error updating article translations: ${error.message}`);
  }
}

async function getTotalArticleCount(): Promise<number> {
  const { count, error } = await supabase
    .from('article_main')
    .select('*', { count: 'exact', head: true })
    .not('full_article_content', 'is', null)
    .or('summary_english.is.null,title_english.is.null,article_preview_text_english.is.null,slug.is.null');

  if (error) {
    console.error('Error getting article count:', error);
    throw error;
  }

  return count || 0;
}

async function main() {
  console.log('🚀 Starting article translation and summarization process...');
  
  try {
    // Get total count of articles that need processing
    const totalArticles = await getTotalArticleCount();
    
    if (totalArticles === 0) {
      console.log('✅ No articles found that need processing.');
      return;
    }
    
    console.log(`📚 Found ${totalArticles} articles to process`);
    
    const batchSize = 5;
    let processedCount = 0;
    
    // Process articles in batches of 5
    while (processedCount < totalArticles) {
      console.log(`\n📦 Processing batch ${Math.floor(processedCount / batchSize) + 1}...`);
      
      // Get next batch of articles
      const articles = await getArticlesFromMain(batchSize);
      
      if (articles.length === 0) {
        console.log('✅ No more articles to process.');
        break;
      }
      
      // Process each article in the batch
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const globalIndex = processedCount + i + 1;
        console.log(`\nProcessing article ${globalIndex}/${totalArticles}: "${article.title}"`);
        console.log(`📅 Published: ${article.article_published_at}`);
        console.log(`🆔 Article ID: ${article.id}`);
        
        try {
          const content = article.full_article_content;
          
          if (!content) {
            console.log('⚠️ No content available for this article, skipping...');
            continue;
          }
          
          console.log('🌐 Translating title to English...');
          const englishTitle = await translateText(article.title, 'title');
          
          console.log('📝 Translating preview text to English...');
          const englishPreview = article.article_preview_text 
            ? await translateText(article.article_preview_text, 'preview text')
            : '';
          
          console.log('🔗 Generating SEO-friendly slug...');
          const slug = generateSlug(englishTitle, article.id);
          
          console.log('🤖 Generating engaging summary...');
          const summary = await generateSummary(article.title, content);
          
          console.log('💾 Updating article_main table with translations, summary, and slug...');
          await updateArticleTranslations(article.id, englishTitle, englishPreview, summary, slug);
          
          console.log('✅ Translations, summary, and slug generated and saved to database');
          console.log(`📝 English Title: ${englishTitle}`);
          console.log(`🔗 Slug: ${slug}`);
          console.log(`📝 Summary: ${summary.substring(0, 100)}...`);
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Error processing article ${article.id}:`, error);
          // Continue with next article instead of stopping
          continue;
        }
      }
      
      processedCount += articles.length;
      console.log(`\n📊 Progress: ${processedCount}/${totalArticles} articles processed (${Math.round(processedCount / totalArticles * 100)}%)`);
      
      // Add a longer delay between batches
      if (processedCount < totalArticles) {
        console.log('⏳ Waiting 3 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n🎉 All articles processed successfully!');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { generateSummary, getArticlesFromMain, updateArticleTranslations, translateText, generateSlug, getTotalArticleCount };
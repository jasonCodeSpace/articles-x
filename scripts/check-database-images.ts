#!/usr/bin/env tsx

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function checkDatabaseImages() {
  console.log('Checking database for articles with featured images...')
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get all articles and check featured_image_url field
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, featured_image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Error fetching articles:', error)
      return
    }
    
    if (!articles || articles.length === 0) {
      console.log('No articles found in database')
      return
    }
    
    console.log(`\nFound ${articles.length} articles (showing latest 10):`)
    console.log('=' .repeat(80))
    
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`)
      console.log(`   ID: ${article.id}`)
      console.log(`   Featured Image: ${article.featured_image_url || 'None'}`)
      console.log(`   Created: ${article.created_at}`)
      console.log('')
    })
    
    const articlesWithImages = articles.filter(a => a.featured_image_url)
    const articlesWithoutImages = articles.filter(a => !a.featured_image_url)
    
    console.log('Summary:')
    console.log(`- Articles with featured images: ${articlesWithImages.length}`)
    console.log(`- Articles without featured images: ${articlesWithoutImages.length}`)
    
    if (articlesWithoutImages.length > 0) {
      console.log('\n💡 Suggestion: Run data ingestion again to update existing articles with cover images')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkDatabaseImages()
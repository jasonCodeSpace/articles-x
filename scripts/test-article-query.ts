import { config } from 'dotenv'
config({ path: '.env.local' })

import { createAnonClient } from '../lib/supabase/server'

async function testArticleQuery() {
  // Also set process.env directly for createAnonClient
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  console.log('Testing article queries...\n')

  const supabase = createAnonClient()

  // Test 1: select('*') - what getArticleBySlug uses
  console.log('Test 1: SELECT * query')
  const { data: allData, error: allError } = await supabase
    .from('articles')
    .select('*')
    .limit(1)

  if (allError) {
    console.error('ERROR with SELECT *:', allError)
    console.error('Error details:', JSON.stringify(allError, null, 2))
  } else {
    console.log('SUCCESS: SELECT * works')
    if (allData && allData.length > 0) {
      console.log('Columns returned:', Object.keys(allData[0]))
    }
  }

  // Test 2: category filter
  console.log('\nTest 2: category filter')
  const { data: categoryData, error: categoryError } = await supabase
    .from('articles')
    .select('id, title')
    .ilike('category', '%Tech%')
    .limit(1)

  if (categoryError) {
    console.error('ERROR with category filter:', categoryError)
    console.error('Error details:', JSON.stringify(categoryError, null, 2))
  } else {
    console.log('SUCCESS: category filter works')
  }

  // Test 3: Get first article slug
  console.log('\nTest 3: Get article by slug')
  const { data: slugData, error: slugError } = await supabase
    .from('articles')
    .select('slug, id, title')
    .limit(1)

  if (slugError) {
    console.error('ERROR getting slug:', slugError)
  } else if (slugData && slugData.length > 0) {
    const slug = slugData[0].slug
    console.log('Found slug:', slug)

    // Now test getArticleBySlug style query
    const { data: articleData, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle()

    if (articleError) {
      console.error('ERROR getting article by slug:', articleError)
      console.error('Error details:', JSON.stringify(articleError, null, 2))
    } else {
      console.log('SUCCESS: getArticleBySlug query works')
      if (articleData) {
        console.log('Article columns:', Object.keys(articleData))
      }
    }
  }
}

testArticleQuery().catch(console.error)

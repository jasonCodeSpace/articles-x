#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { harvestedToDatabase, type HarvestedArticle } from '@/lib/ingest'

// Load environment variables (server-only)
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. Set them in .env.local (server-only).')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type TweetRow = {
  tweet_id: string
  author_handle: string
  author_name: string
  author_profile_image: string | null
  created_at_twitter: string
  article_url: string | null
  article_title: string | null
  article_excerpt: string | null
  article_featured_image: string | null
  article_rest_id: string | null
}

function toHarvested(row: TweetRow): HarvestedArticle | null {
  if (!row.article_url) return null

  const title = row.article_title?.trim() || 'Untitled Article'

  const harvested: HarvestedArticle = {
    article_url: row.article_url,
    title,
    excerpt: row.article_excerpt || undefined,
    author_name: row.author_name,
    author_handle: row.author_handle,
    author_profile_image: row.author_profile_image || undefined,
    tweet_id: row.tweet_id,
    rest_id: row.article_rest_id || undefined,
    original_url: row.article_url,
    created_at: row.created_at_twitter,
    featured_image_url: row.article_featured_image || undefined,
  }

  return harvested
}

async function migrate() {
  console.log('Starting migration from tweets(has_article=true) to articles...')

  let from = 0
  const pageSize = 1000
  const uniqueByUrl = new Map<string, TweetRow>()

  while (true) {
    const { data, error } = await supabase
      .from('tweets')
      .select(
        [
          'tweet_id',
          'author_handle',
          'author_name',
          'author_profile_image',
          'created_at_twitter',
          'article_url',
          'article_title',
          'article_excerpt',
          'article_featured_image',
          'article_rest_id',
        ].join(', ')
      )
      .eq('has_article', true)
      .not('article_url', 'is', null)
      .range(from, from + pageSize - 1)
      .returns<TweetRow[]>()

    if (error) {
      console.error('Failed to fetch tweets:', error)
      process.exit(1)
    }

    if (!data || data.length === 0) break

    const rows: TweetRow[] = data ?? []
    for (const row of rows) {
      if (!row.article_url) continue
      // Deduplicate by article_url
      if (!uniqueByUrl.has(row.article_url)) uniqueByUrl.set(row.article_url, row)
    }

    if (rows.length < pageSize) break
    from += pageSize
  }

  console.log(`Found ${uniqueByUrl.size} unique articles in tweets to migrate.`)

  let inserted = 0
  let updated = 0
  let skipped = 0

  for (const [articleUrl, row] of uniqueByUrl) {
    try {
      const harvested = toHarvested(row)
      if (!harvested) {
        skipped++
        continue
      }

      const dbArticle = harvestedToDatabase(harvested)

      // Build a minimal payload with highly stable columns
      const payload = {
        title: dbArticle.title,
        slug: dbArticle.slug,
        content: dbArticle.content,
        author_name: dbArticle.author_name,
        article_url: dbArticle.article_url ?? null,
        status: 'published' as const,
        published_at: dbArticle.published_at ?? new Date(row.created_at_twitter).toISOString(),
      }

      // Prefer to identify existing article by article_url first to avoid duplicates
      const { data: existingByUrl, error: lookupUrlErr } = await supabase
        .from('articles')
        .select('id, slug')
        .eq('article_url', articleUrl)
        .limit(1)

      if (lookupUrlErr) {
        console.error(`Lookup error by article_url for ${articleUrl}:`, lookupUrlErr)
        skipped++
        continue
      }

      if (existingByUrl && existingByUrl.length > 0) {
        const { error: updateErr } = await supabase
          .from('articles')
          .update({
            // Don't change slug when matching by URL
            title: payload.title,
            content: payload.content,
            author_name: payload.author_name,
            article_url: payload.article_url,
            status: payload.status,
            published_at: payload.published_at,
          })
          .eq('id', existingByUrl[0].id)

        if (updateErr) {
          console.error(`Update error for ${articleUrl}:`, updateErr)
          skipped++
        } else {
          updated++
        }
        continue
      }

      // If not found by URL, try by slug
      const { data: existingBySlug, error: lookupSlugErr } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', payload.slug)
        .single()

      if (lookupSlugErr && (lookupSlugErr as any).code !== 'PGRST116') {
        console.error(`Lookup error by slug for ${payload.slug}:`, lookupSlugErr)
        skipped++
        continue
      }

      if (existingBySlug) {
        const { error: updateErr } = await supabase
          .from('articles')
          .update({
            title: payload.title,
            content: payload.content,
            author_name: payload.author_name,
            article_url: payload.article_url,
            status: payload.status,
            published_at: payload.published_at,
          })
          .eq('id', existingBySlug.id)

        if (updateErr) {
          console.error(`Update error by slug for ${payload.slug}:`, updateErr)
          skipped++
        } else {
          updated++
        }
      } else {
        const { error: insertErr } = await supabase
          .from('articles')
          .insert([payload])

        if (insertErr) {
          console.error(`Insert error for ${articleUrl}:`, insertErr)
          skipped++
        } else {
          inserted++
        }
      }
    } catch (e) {
      console.error(`Unexpected error migrating ${articleUrl}:`, e)
      skipped++
    }
  }

  console.log(`Done. inserted=${inserted}, updated=${updated}, skipped=${skipped}`)
}

migrate().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})
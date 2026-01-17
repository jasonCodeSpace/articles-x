# Data Pipeline Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the X article extraction pipeline to properly fetch full content, metrics, generate correct summaries, and produce valid slugs.

**Architecture:** Two-stage fetching (list → deep fetch), DeepSeek for AI (separate EN/ZH calls), simplified workflow without intermediate tweets table.

**Tech Stack:** TypeScript, Next.js, Supabase, RapidAPI (Twitter), DeepSeek API

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/030_pipeline_redesign.sql`

**Step 1: Write migration script**

```sql
-- Migration: Pipeline Redesign
-- Remove unused fields and ensure required fields exist

-- Remove unused fields
ALTER TABLE articles DROP COLUMN IF EXISTS tweet_bookmarks;
ALTER TABLE articles DROP COLUMN IF EXISTS article_preview_text;

-- Ensure required fields exist
ALTER TABLE articles ADD COLUMN IF NOT EXISTS title_english TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add index for deduplication queries
CREATE INDEX IF NOT EXISTS idx_articles_tweet_id ON articles(tweet_id);
```

**Step 2: Apply migration**

Run: `npx supabase db push` or apply via Supabase dashboard

**Step 3: Commit**

```bash
git add supabase/migrations/030_pipeline_redesign.sql
git commit -m "db: remove unused fields, add title_english and language"
```

---

## Task 2: Add English Detection Utility

**Files:**
- Modify: `lib/url-utils.ts`
- Test: Manual testing in console

**Step 1: Add isEnglish function to url-utils.ts**

Add at end of file:

```typescript
/**
 * Detect if text is primarily English (Latin characters)
 * Returns true if >50% of letters are Latin alphabet
 */
export function isEnglish(text: string): boolean {
  if (!text || text.trim().length === 0) return true

  // Keep only letters (Latin + CJK + Japanese)
  const letters = text.replace(/[^a-zA-Z\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, '')
  if (letters.length === 0) return true

  const latinChars = letters.replace(/[^a-zA-Z]/g, '').length
  return latinChars / letters.length > 0.5
}
```

**Step 2: Commit**

```bash
git add lib/url-utils.ts
git commit -m "feat: add isEnglish detection utility"
```

---

## Task 3: Fix Slug Generation

**Files:**
- Modify: `lib/url-utils.ts` - function `generateSlugFromTitle`

**Step 1: Rewrite generateSlugFromTitle function**

Replace the existing function with:

```typescript
/**
 * Generate URL-safe slug from title
 * For non-English titles, use title_english instead
 */
export function generateSlugFromTitle(title: string): string {
  if (!title || title.trim().length === 0) {
    return ''
  }

  return title
    .toLowerCase()
    .normalize('NFD')                          // Decompose accents
    .replace(/[\u0300-\u036f]/g, '')          // Remove accent marks
    .replace(/[_\s]+/g, '-')                  // Spaces/underscores → hyphens
    .replace(/[^a-z0-9-]/g, '')               // Remove non-alphanumeric
    .replace(/-+/g, '-')                      // Collapse multiple hyphens
    .replace(/^-|-$/g, '')                    // Trim leading/trailing hyphens
    .substring(0, 100)                        // Limit length
}

/**
 * Generate slug with fallback for non-English titles
 */
export function generateSlug(title: string, titleEnglish: string | null, tweetId: string): string {
  // Try English title first for non-English content
  if (titleEnglish && !isEnglish(title)) {
    const slug = generateSlugFromTitle(titleEnglish)
    if (slug.length > 0) return slug
  }

  // Try original title
  const slug = generateSlugFromTitle(title)
  if (slug.length > 0) return slug

  // Fallback: article-{first 6 chars of tweet_id}
  const shortId = tweetId.replace(/-/g, '').substring(0, 6)
  return `article-${shortId}`
}
```

**Step 2: Commit**

```bash
git add lib/url-utils.ts
git commit -m "fix: rewrite slug generation with proper transliteration"
```

---

## Task 4: Refactor DeepSeek API - Separate EN/ZH Calls

**Files:**
- Modify: `lib/deepseek.ts`

**Step 1: Read current deepseek.ts structure**

Review the existing file to understand current implementation.

**Step 2: Rewrite with separate functions**

Replace/refactor to have these functions:

```typescript
/**
 * Generate English summary + category + title translation (if needed)
 * Single language output: ALL ENGLISH
 */
export async function generateEnglishAnalysis(
  content: string,
  title: string,
  needsTitleTranslation: boolean
): Promise<{
  summary_english: string
  category: string
  title_english: string | null
}> {
  const prompt = needsTitleTranslation
    ? `Analyze this article and respond in English only.

TITLE: ${title}

CONTENT:
${content.substring(0, 8000)}

Respond in this exact format:
TITLE_ENGLISH: [English translation of the title]
CATEGORY: [One word category: Technology, Business, Politics, Science, Culture, Sports, Other]
SUMMARY: [2-3 sentence summary in English]`
    : `Analyze this article and respond in English only.

TITLE: ${title}

CONTENT:
${content.substring(0, 8000)}

Respond in this exact format:
CATEGORY: [One word category: Technology, Business, Politics, Science, Culture, Sports, Other]
SUMMARY: [2-3 sentence summary in English]`

  const response = await callDeepSeek(prompt)

  return parseEnglishResponse(response, title, needsTitleTranslation)
}

/**
 * Translate English summary to Chinese
 * Single language output: ALL CHINESE
 */
export async function translateToChinese(summaryEnglish: string): Promise<string> {
  const prompt = `将以下英文摘要翻译成中文，只输出中文翻译，不要有任何英文：

${summaryEnglish}`

  const response = await callDeepSeek(prompt)
  return response.trim()
}

/**
 * Parse English analysis response
 */
function parseEnglishResponse(
  text: string,
  originalTitle: string,
  needsTitleTranslation: boolean
): { summary_english: string; category: string; title_english: string | null } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  let title_english: string | null = null
  let category = 'Other'
  let summary_english = ''

  for (const line of lines) {
    if (line.startsWith('TITLE_ENGLISH:')) {
      title_english = line.replace('TITLE_ENGLISH:', '').trim()
    } else if (line.startsWith('CATEGORY:')) {
      category = line.replace('CATEGORY:', '').trim()
    } else if (line.startsWith('SUMMARY:')) {
      summary_english = line.replace('SUMMARY:', '').trim()
    }
  }

  // If no SUMMARY label found, use remaining text
  if (!summary_english) {
    const summaryStart = text.indexOf('SUMMARY:')
    if (summaryStart !== -1) {
      summary_english = text.substring(summaryStart + 8).trim()
    } else {
      // Last resort: use the whole response minus parsed fields
      summary_english = text
    }
  }

  return {
    summary_english,
    category,
    title_english: needsTitleTranslation ? title_english : originalTitle
  }
}
```

**Step 3: Commit**

```bash
git add lib/deepseek.ts
git commit -m "refactor: separate DeepSeek calls for EN/ZH output"
```

---

## Task 5: Fix Twitter API - Deep Fetch for Metrics

**Files:**
- Modify: `lib/twitter.ts`

**Step 1: Verify fetchTweet endpoint returns metrics**

Check the `fetchTweet` method to ensure it extracts metrics from the correct path in the response.

**Step 2: Fix metrics extraction in fetchTweet**

Ensure metrics are extracted from the deep-fetched response. Look for these paths:
- `tweet.legacy.favorite_count` → likes
- `tweet.legacy.reply_count` → replies
- `tweet.legacy.retweet_count` → retweets
- `tweet.views.count` → views

Update the response parsing to correctly extract these values.

**Step 3: Commit**

```bash
git add lib/twitter.ts
git commit -m "fix: extract metrics from deep-fetched tweet response"
```

---

## Task 6: Fix Article Mapping in ingest.ts

**Files:**
- Modify: `lib/ingest.ts`

**Step 1: Update mapTweetToArticle function**

Ensure it correctly maps:
- `full_article_content` from `articleResult.content` (not truncated)
- All metrics from the deep-fetched response
- `tweet_text` from `legacy.full_text`

**Step 2: Update harvestedToDatabase function**

- Remove `tweet_bookmarks` mapping
- Remove `article_preview_text` mapping
- Add proper slug generation using the new `generateSlug` function

```typescript
import { generateSlug, isEnglish } from './url-utils'

// In harvestedToDatabase:
const slug = generateSlug(
  harvested.title,
  harvested.title_english || null,
  harvested.tweet_id
)
```

**Step 3: Commit**

```bash
git add lib/ingest.ts
git commit -m "fix: proper field mapping and slug generation"
```

---

## Task 7: Rewrite Workflow Steps

**Files:**
- Modify: `lib/workflow/steps/extract-articles.ts`
- Modify: `lib/workflow/steps/generate-summaries.ts`
- Modify: `lib/workflow/steps/save-summaries.ts`

**Step 1: Update extract-articles.ts**

- Filter tweets with article_results
- Deep fetch each tweet for full content and metrics
- Return articles ready for summary generation

**Step 2: Update generate-summaries.ts**

```typescript
import { generateEnglishAnalysis, translateToChinese } from '@/lib/deepseek'
import { isEnglish } from '@/lib/url-utils'

// For each article without summaries:
const needsTitleTranslation = !isEnglish(article.title)

// Call 1: English analysis
const englishResult = await generateEnglishAnalysis(
  article.full_article_content,
  article.title,
  needsTitleTranslation
)

// Call 2: Chinese translation
const summary_chinese = await translateToChinese(englishResult.summary_english)

// Combine results
article.title_english = needsTitleTranslation
  ? englishResult.title_english
  : article.title
article.summary_english = englishResult.summary_english
article.summary_chinese = summary_chinese
article.category = englishResult.category
```

**Step 3: Update save-summaries.ts**

Ensure it saves:
- `title_english`
- `summary_english`
- `summary_chinese`
- `category`
- `language` (detected)

**Step 4: Commit**

```bash
git add lib/workflow/steps/
git commit -m "refactor: workflow steps with proper DeepSeek calls"
```

---

## Task 8: Update Daily Digest Generation

**Files:**
- Modify: `app/api/cron/generate-daily-summary/route.ts`

**Step 1: Switch from Gemini to DeepSeek**

**Step 2: Implement two-call strategy**

```typescript
// Step 1: Generate English digest
const englishDigestPrompt = `Create a daily digest from these article summaries.
Format (no emoji, plain text only):

DAILY DIGEST | ${formattedDate} | ${articles.length} Articles

HIGHLIGHTS

1. [Most important article title]
   [One sentence summary]

2. [Second article title]
   [One sentence summary]

3. [Third article title]
   [One sentence summary]


QUICK READS

- [Brief topic point]
- [Brief topic point]
- [Brief topic point]


KEY NUMBERS

- [Number]: [Context]
- [Number]: [Context]

Articles:
${articlesText}`

const digestEnglish = await callDeepSeek(englishDigestPrompt)

// Step 2: Translate to Chinese
const chineseDigestPrompt = `将以下英文日报翻译成中文，保持相同格式，不要有emoji：

${digestEnglish}`

const digestChinese = await callDeepSeek(chineseDigestPrompt)
```

**Step 3: Update database save**

Save to `daily_summary` table with:
- `summary_content` → English version
- `summary_json_en` → null (no longer using JSON)
- `summary_json_zh` → null
- Add new fields or use existing ones for both versions

**Step 4: Commit**

```bash
git add app/api/cron/generate-daily-summary/route.ts
git commit -m "refactor: daily digest with DeepSeek, separate EN/ZH calls"
```

---

## Task 9: Integration Testing

**Step 1: Test single article fetch**

```bash
# Create test script or use existing workflow trigger
npm run ingest -- --test-single
```

Verify:
- Full content is fetched (not truncated)
- Metrics are non-zero
- Slug is properly formatted

**Step 2: Test summary generation**

Verify:
- `summary_english` is in English
- `summary_chinese` is in Chinese
- `title_english` is translated for non-English titles

**Step 3: Test daily digest**

Trigger manually and verify format matches spec.

**Step 4: Commit any fixes**

```bash
git add .
git commit -m "fix: integration test fixes"
```

---

## Task 10: Cleanup and Final Commit

**Step 1: Remove dead code**

- Remove any unused functions
- Remove references to deleted fields

**Step 2: Final commit**

```bash
git add .
git commit -m "chore: cleanup after pipeline redesign"
```

---

## Summary

| Task | Description | Est. |
|------|-------------|------|
| 1 | Database migration | 5 min |
| 2 | English detection utility | 5 min |
| 3 | Fix slug generation | 10 min |
| 4 | Refactor DeepSeek API | 20 min |
| 5 | Fix Twitter API metrics | 15 min |
| 6 | Fix article mapping | 15 min |
| 7 | Rewrite workflow steps | 30 min |
| 8 | Update daily digest | 20 min |
| 9 | Integration testing | 30 min |
| 10 | Cleanup | 10 min |

/**
 * Quick script to re-categorize articles with updated logic
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl!, serviceKey!)

const CATEGORY_PATTERNS = {
  'tech:ai': {
    main: 'tech',
    sub: 'ai',
    keywords: [/\bai\b/i, /machine learning/i, /llm/i, /gpt/i, /openai/i, /anthropic/i, /claude/i, /chatgpt/i, /neural/i, /deep learning/i, /transformer/i]
  },
  'tech:crypto': {
    main: 'tech',
    sub: 'crypto',
    keywords: [/crypto/i, /bitcoin/i, /ethereum/i, /blockchain/i, /defi/i, /web3/i, /nft/i, /token/i, /\bcoin\b/i]
  },
  'tech:data': {
    main: 'tech',
    sub: 'data',
    keywords: [/python/i, /javascript/i, /typescript/i, /code/i, /programming/i, /developer/i, /coding/i, /data science/i, /analytics/i]
  },
  'tech:security': {
    main: 'tech',
    sub: 'security',
    keywords: [/security/i, /hack/i, /privacy/i, /cyber/i, /encryption/i, /vulnerability/i, /breach/i]
  },
  'tech:hardware': {
    main: 'tech',
    sub: 'hardware',
    keywords: [/chip/i, /semiconductor/i, /hardware/i, /device/i, /gpu/i, /cpu/i, /nvidia/i]
  },
  'business:startups': {
    main: 'business',
    sub: 'startups',
    keywords: [/startup/i, /founder/i, /entrepreneur/i, /\byc\b/i, /venture capital/i, /pitch/i, /bootstrapping/i, /series a/i, /seed round/i]
  },
  'business:markets': {
    main: 'business',
    sub: 'markets',
    keywords: [/market/i, /stock/i, /trading/i, /investing/i, /economy/i, /inflation/i, /recession/i, /fed/i, /dividend/i]
  },
  'business:marketing': {
    main: 'business',
    sub: 'marketing',
    keywords: [/marketing/i, /promotion/i, /seo/i, /social media/i, /growth/i, /\bad\b/i, /funnel/i]
  },
  'product:product': {
    main: 'product',
    sub: 'product',
    keywords: [/product management/i, /\bpm\b/i, /ux research/i, /product strategy/i, /roadmap/i, /kpi/i, /metrics/i]
  },
  'product:design': {
    main: 'product',
    sub: 'design',
    keywords: [/design/i, /\bui\b.*\bux\b/i, /ux design/i, /figma/i, /design system/i, /typography/i, /branding/i]
  },
  'product:gaming': {
    main: 'product',
    sub: 'gaming',
    keywords: [/gaming/i, /game/i, /esports/i, /playstation/i, /xbox/i, /nintendo/i]
  },
  'science:science': {
    main: 'science',
    sub: 'science',
    keywords: [/research/i, /study/i, /physics/i, /chemistry/i, /biology/i, /scientific/i, /paper/i, /journal/i]
  },
  'science:health': {
    main: 'science',
    sub: 'health',
    keywords: [/health/i, /medical/i, /medicine/i, /wellness/i, /mental health/i, /doctor/i, /hospital/i, /fitness/i]
  },
  'science:education': {
    main: 'science',
    sub: 'education',
    keywords: [/education/i, /learning/i, /school/i, /university/i, /course/i, /tutorial/i]
  },
  'science:environment': {
    main: 'science',
    sub: 'environment',
    keywords: [/climate/i, /environment/i, /sustainability/i, /carbon/i, /green energy/i]
  },
  'culture:media': {
    main: 'culture',
    sub: 'media',
    keywords: [/journalism/i, /media/i, /news/i, /twitter/i, /\bx\b/i, /social platform/i]
  },
  'culture:culture': {
    main: 'culture',
    sub: 'culture',
    keywords: [/culture/i, /society/i, /trend/i, /generation/i]
  },
  'culture:philosophy': {
    main: 'culture',
    sub: 'philosophy',
    keywords: [/philosophy/i, /ethics/i, /thinking/i, /mindset/i, /wisdom/i, /\blife\b/i, /fix your/i, /improve/i, /habit/i, /productivity/i, /success/i, /happiness/i, /meaning/i, /purpose/i, /goal/i, /motivation/i, /self.?improvement/i]
  },
  'culture:history': {
    main: 'culture',
    sub: 'history',
    keywords: [/history/i, /historical/i, /past/i, /lesson/i]
  },
  'culture:policy': {
    main: 'culture',
    sub: 'policy',
    keywords: [/policy/i, /politics/i, /government/i, /regulation/i, /law/i, /election/i]
  },
  'culture:personal-story': {
    main: 'culture',
    sub: 'personal-story',
    keywords: [/my story/i, /personal/i, / memoir/i, /autobiography/i]
  }
}

function generateCategory(title: string) {
  const lowerTitle = title.toLowerCase()
  for (const [combined, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    for (const regex of pattern.keywords) {
      if (regex.test(lowerTitle)) {
        return { category: combined, main: pattern.main, sub: pattern.sub }
      }
    }
  }
  return { category: 'culture:culture', main: 'culture', sub: 'culture' }
}

async function main() {
  // First, check total articles count
  const { count: totalCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
  console.log(`Total articles in database: ${totalCount}`)

  // Check indexed articles count
  const { count: indexedCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('indexed', true)
  console.log(`Indexed articles: ${indexedCount}`)

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, title_english, category')
    .eq('indexed', true)
    .order('updated_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Error fetching articles:', error)
    return
  }

  console.log(`Re-categorizing ${articles?.length || 0} articles...`)

  let updated = 0
  for (const article of articles || []) {
    const titleToUse = article.title_english || article.title
    const cat = generateCategory(titleToUse)

    const { error: updateError } = await supabase
      .from('articles')
      .update({
        category: cat.category,
        main_category: cat.main,
        sub_category: cat.sub
      })
      .eq('id', article.id)

    if (!updateError) {
      console.log(`${article.title.substring(0, 40).padEnd(40)} -> ${cat.category}`)
      updated++
    } else {
      console.error(`Error updating ${article.title}:`, updateError.message)
    }
  }

  console.log(`\nDone! Updated ${updated} articles.`)
}

main()

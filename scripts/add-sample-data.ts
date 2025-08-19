#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Sample article data based on the JSON you provided
const sampleArticles = [
  {
    title: "PumpFun is winning.",
    slug: "pumpfun-is-winning",
    content: "First of all, this is not an attack on LetsBonk; I think the Bonk team, led by Tom, did a fantastic job of winning over memecoin mindshare to the degree that a counterattack is not worth it. LetsBonk showcases how pump.fun's mechanics can create viral moments that capture attention across the crypto ecosystem.",
    excerpt: "First of all, this is not an attack on LetsBonk; I think the Bonk team, led by Tom, did a fantastic job of winning over memecoin mindshare to the degree that a counterattack is not worth it. LetsBonk",
    author_name: "Crypto Analyst Pro",
    author_handle: "crypto_analyst_pro",
    author_profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    status: 'published',
    published_at: new Date().toISOString(),
    meta_title: "PumpFun is winning.",
    meta_description: "Analysis of PumpFun's success in the memecoin space and its impact on the crypto ecosystem.",
    featured_image_url: "https://pbs.twimg.com/media/GxXN2RLWcAAmv-A.jpg",
    article_url: "https://x.com/i/articles/1951672267450052608",
    tags: ['crypto', 'memecoin', 'pumpfun', 'analysis'],
    category: 'crypto-analysis'
  },
  {
    title: "The Future of Decentralized Finance",
    slug: "future-of-defi",
    content: "Decentralized Finance (DeFi) continues to evolve rapidly, with new protocols and innovations emerging daily. From yield farming to automated market makers, the landscape is constantly shifting. This comprehensive analysis explores the key trends shaping the future of financial systems.",
    excerpt: "Exploring the rapidly evolving landscape of DeFi and its impact on traditional financial systems.",
    author_name: "DeFi Research Team",
    author_handle: "defi_research",
    author_profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    status: 'published',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    meta_title: "The Future of Decentralized Finance",
    meta_description: "Comprehensive analysis of DeFi trends and innovations shaping the future of finance.",
    featured_image_url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop",
    article_url: "https://defiresearch.com/future-of-defi",
    tags: ['defi', 'blockchain', 'finance', 'innovation'],
    category: 'defi'
  },
  {
    title: "NFT Market Analysis: 2024 Trends",
    slug: "nft-market-analysis-2024",
    content: "The NFT market has experienced significant changes throughout 2024. From the rise of utility-focused NFTs to the emergence of new marketplaces, collectors and creators are adapting to a more mature ecosystem. This analysis breaks down the key developments and future outlook.",
    excerpt: "Breaking down the key developments in the NFT space and what they mean for collectors and creators.",
    author_name: "NFT Market Insider",
    author_handle: "nft_insider",
    author_profile_image: "https://images.unsplash.com/photo-1494790108755-2616b612b385?w=150&h=150&fit=crop&crop=face",
    status: 'published',
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    meta_title: "NFT Market Analysis: 2024 Trends",
    meta_description: "Comprehensive analysis of NFT market trends and developments in 2024.",
    featured_image_url: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=800&h=400&fit=crop",
    article_url: "https://nftinsider.com/market-analysis-2024",
    tags: ['nft', 'digital-art', 'market-analysis', 'trends'],
    category: 'nft-analysis'
  },
  {
    title: "Web3 Gaming Revolution",
    slug: "web3-gaming-revolution",
    content: "The gaming industry is experiencing a fundamental shift towards Web3 integration. Play-to-earn mechanics, true digital ownership, and decentralized gaming economies are reshaping how we think about interactive entertainment. This deep dive examines the most promising projects and technologies.",
    excerpt: "How Web3 is transforming the gaming industry with new economic models and player ownership.",
    author_name: "GameFi Explorer",
    author_handle: "gamefi_explorer",
    author_profile_image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
    status: 'published',
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    meta_title: "Web3 Gaming Revolution",
    meta_description: "Exploring how Web3 technologies are revolutionizing the gaming industry.",
    featured_image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop",
    article_url: "https://gamefi.com/web3-gaming-revolution",
    tags: ['web3', 'gaming', 'play-to-earn', 'blockchain'],
    category: 'gamefi'
  },
  {
    title: "Layer 2 Scaling Solutions Comparison",
    slug: "layer2-scaling-solutions",
    content: "Ethereum's scaling challenges have spawned numerous Layer 2 solutions, each with unique approaches and trade-offs. From Optimistic Rollups to Zero-Knowledge proofs, developers now have multiple options for building scalable applications. This guide compares the leading L2 networks.",
    excerpt: "Comprehensive comparison of Layer 2 scaling solutions for Ethereum applications.",
    author_name: "Blockchain Engineer",
    author_handle: "blockchain_eng",
    author_profile_image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
    status: 'published',
    published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    meta_title: "Layer 2 Scaling Solutions Comparison",
    meta_description: "Detailed comparison of Layer 2 scaling solutions for Ethereum blockchain.",
    featured_image_url: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&h=400&fit=crop",
    article_url: "https://blockchain.com/layer2-solutions",
    tags: ['ethereum', 'layer2', 'scaling', 'rollups'],
    category: 'infrastructure'
  },
  {
    title: "Sustainable Blockchain Technologies",
    slug: "sustainable-blockchain-tech",
    content: "Environmental concerns about blockchain energy consumption have led to innovative solutions for sustainable networks. From Proof-of-Stake consensus to carbon-neutral protocols, the industry is prioritizing eco-friendly approaches without sacrificing security or decentralization.",
    excerpt: "How blockchain technology is evolving to address environmental sustainability concerns.",
    author_name: "Green Tech Advocate",
    author_handle: "green_tech_adv",
    author_profile_image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    status: 'published',
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    meta_title: "Sustainable Blockchain Technologies",
    meta_description: "Exploring eco-friendly approaches to blockchain technology and cryptocurrency mining.",
    featured_image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop",
    article_url: "https://greentech.com/sustainable-blockchain",
    tags: ['sustainability', 'green-tech', 'proof-of-stake', 'environment'],
    category: 'sustainability'
  }
]

async function addSampleData() {
  console.log('📝 Adding Sample Article Data to Articles X')
  console.log('===============================================')
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('✅ Connected to Supabase with service role')

    // Insert sample articles
    const { data, error } = await supabase
      .from('articles')
      .insert(sampleArticles)
      .select('id, title')

    if (error) {
      console.error('❌ Error inserting sample articles:', error.message)
      process.exit(1)
    }

    console.log('✅ Successfully added sample articles:')
    data?.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title} (ID: ${article.id})`)
    })

    // Get total count
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    console.log(`\n📊 Total published articles: ${count}`)
    console.log('\n🎉 Sample data added successfully!')
    console.log('\n👉 Now visit your app to see the Articles X feed in action!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

addSampleData()
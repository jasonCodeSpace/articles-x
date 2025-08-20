import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const rapidApiKey = process.env.RAPIDAPI_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to generate slug from title with unique identifier
function generateSlug(title: string, uniqueId: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 40) // Reduced to make room for unique ID
  
  return `${baseSlug}-${uniqueId}`
}

// Function to generate realistic article content based on category and author
function generateArticleContent(tweetData: any, category: string): {
  title: string
  content: string
  excerpt: string
  metaTitle: string
  metaDescription: string
} {
  const authorName = tweetData.author_name || ''
  const authorHandle = tweetData.author_handle || ''
  const tweetText = tweetData.content || ''
  
  let title = ''
  let content = ''
  
  // Generate realistic titles and content based on category
  switch (category) {
    case 'crypto':
      if (authorName.toLowerCase().includes('wallet')) {
        title = 'The Future of Digital Wallets: Security and Innovation'
        content = `Digital wallets are revolutionizing how we interact with cryptocurrencies and decentralized finance. As the crypto ecosystem continues to evolve, wallet security and user experience have become paramount concerns for both developers and users.\n\nThe latest developments in wallet technology focus on multi-signature security, hardware integration, and seamless DeFi interactions. These innovations are making cryptocurrency more accessible to mainstream users while maintaining the highest security standards.\n\nKey features that modern wallets are implementing include:\n\n• Advanced encryption protocols\n• Biometric authentication\n• Cross-chain compatibility\n• DeFi protocol integration\n• NFT management capabilities\n\nAs we move forward, the wallet ecosystem will continue to mature, offering users more sophisticated tools for managing their digital assets. The focus remains on balancing security, usability, and functionality to create the best possible user experience.\n\nThe future of digital finance depends heavily on these foundational tools, and the current trajectory suggests we're heading toward a more secure and user-friendly crypto ecosystem.`
      } else {
        title = 'Understanding the Crypto Market: Trends and Opportunities'
        content = `The cryptocurrency market continues to evolve at a rapid pace, presenting both opportunities and challenges for investors and enthusiasts. Recent developments in blockchain technology, regulatory frameworks, and institutional adoption are shaping the future of digital assets.\n\nMarket analysis shows increasing interest from traditional financial institutions, with many now offering crypto services to their clients. This institutional adoption is driving legitimacy and stability in what was once considered a highly volatile and speculative market.\n\nKey trends to watch include:\n\n• Regulatory clarity in major markets\n• Central Bank Digital Currencies (CBDCs)\n• DeFi protocol maturation\n• NFT utility expansion\n• Layer 2 scaling solutions\n\nThe integration of cryptocurrency into everyday financial services is accelerating, with payment processors, banks, and fintech companies all exploring blockchain-based solutions. This mainstream adoption is creating new use cases and driving innovation across the entire ecosystem.\n\nAs the market matures, we can expect to see more sophisticated financial products, improved user experiences, and greater regulatory clarity that will benefit both individual and institutional participants.`
      }
      break
      
    case 'ai':
      title = 'Artificial Intelligence: Transforming Industries and Society'
      content = `Artificial Intelligence is no longer a futuristic concept—it's a present reality that's transforming industries, reshaping workflows, and redefining what's possible in technology. From machine learning algorithms that power recommendation systems to large language models that can engage in human-like conversations, AI is becoming increasingly sophisticated and accessible.\n\nThe current wave of AI innovation is characterized by several key developments:\n\n• Large Language Models (LLMs) with improved reasoning capabilities\n• Computer vision systems with near-human accuracy\n• Autonomous systems in transportation and logistics\n• AI-powered drug discovery and medical diagnosis\n• Creative AI for content generation and design\n\nThese advancements are not just technical achievements—they're practical tools that are being integrated into everyday business operations. Companies across industries are leveraging AI to improve efficiency, reduce costs, and create new products and services.\n\nHowever, with great power comes great responsibility. The AI community is actively working on addressing challenges related to bias, transparency, and ethical use. Ensuring that AI systems are fair, explainable, and aligned with human values is crucial for their continued development and adoption.\n\nAs we look to the future, AI will likely become even more integrated into our daily lives, from smart homes and personalized healthcare to autonomous vehicles and intelligent assistants. The key is to harness this technology responsibly while maximizing its benefits for society.`
      break
      
    case 'tech':
      title = 'Technology Innovation: Building the Future'
      content = `The technology landscape is evolving at an unprecedented pace, with innovations in software development, cloud computing, and emerging technologies reshaping how we work, communicate, and solve complex problems. Today's technological advancements are laying the foundation for tomorrow's breakthroughs.\n\nSeveral key areas are driving this transformation:\n\n• Cloud-native architectures and serverless computing\n• Edge computing and IoT integration\n• Quantum computing research and development\n• Sustainable technology and green computing\n• Advanced cybersecurity measures\n\nSoftware development practices are also evolving, with DevOps, continuous integration, and agile methodologies becoming standard practices. These approaches enable faster development cycles, better collaboration, and more reliable software delivery.\n\nThe rise of open-source technologies has democratized access to powerful tools and frameworks, enabling developers and organizations of all sizes to build sophisticated applications. This collaborative approach to technology development is accelerating innovation and creating new opportunities for creativity and problem-solving.\n\nEmerging technologies like augmented reality, virtual reality, and mixed reality are creating new interfaces and experiences that blur the line between digital and physical worlds. These technologies are finding applications in education, healthcare, entertainment, and enterprise solutions.\n\nAs we continue to push the boundaries of what's possible with technology, the focus remains on creating solutions that are not only innovative but also accessible, sustainable, and beneficial to society as a whole.`
      break
      
    default:
      title = 'Insights and Perspectives: Navigating the Digital Age'
      content = `In our rapidly evolving digital landscape, staying informed and adaptable has become more important than ever. The convergence of technology, society, and culture is creating new opportunities and challenges that require thoughtful consideration and strategic thinking.\n\nThe digital transformation affecting every aspect of our lives includes:\n\n• Remote work and digital collaboration tools\n• E-commerce and digital marketplaces\n• Social media and digital communication\n• Online education and skill development\n• Digital health and telemedicine\n\nThese changes are not just technological—they're fundamentally altering how we interact, learn, work, and live. Understanding these shifts and their implications is crucial for individuals and organizations looking to thrive in the digital age.\n\nThe importance of digital literacy cannot be overstated. As technology becomes more integrated into our daily lives, the ability to understand, use, and critically evaluate digital tools and information becomes essential. This includes understanding privacy, security, and the ethical implications of our digital choices.\n\nLooking ahead, the trends suggest continued integration of digital technologies into all aspects of life. Success in this environment requires not just technical skills, but also adaptability, critical thinking, and a commitment to lifelong learning.\n\nThe future belongs to those who can navigate this digital landscape thoughtfully and purposefully, leveraging technology to create value while maintaining human connections and values.`
  }
  
  // Generate excerpt (first 200 characters)
  const excerpt = content.substring(0, 200).trim() + '...'
  
  // Generate meta title and description
  const metaTitle = title
  const metaDescription = excerpt.replace('...', '')
  
  return {
    title,
    content,
    excerpt,
    metaTitle,
    metaDescription
  }
}

// Function to get tweet data from RapidAPI using the correct endpoint
async function getTweetData(tweetId: string): Promise<any> {
  try {
    const response = await fetch(`https://twitter241.p.rapidapi.com/tweet?pid=${tweetId}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'twitter241.p.rapidapi.com'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching tweet data:', error)
    return null
  }
}

// Function to extract real data from tweet JSON using correct API response structure
function extractRealDataFromTweet(apiResponse: any): {
  authorName: string
  authorHandle: string
  authorProfileImage: string
  articleTitle: string
  articlePreviewText: string
  featuredImageUrl: string
  tweetUrl: string
  createdAt: string
} | null {
  try {
    // Check if this is the correct API response structure
    if (!apiResponse || typeof apiResponse !== 'object') {
      console.log('Invalid API response structure')
      return null
    }
    
    // Extract tweet data from the API response structure
    const conversation = apiResponse.data?.threaded_conversation_with_injections_v2
    if (!conversation?.instructions) {
      console.log('Invalid API response structure - no conversation data')
      return null
    }

    // Find the instruction with entries (usually TimelineAddEntries)
    let tweetData = null
    let userResult = null
    let legacy = null
    let userLegacy = null
    let articleData = null
    let tweetId = ''

    for (const instruction of conversation.instructions) {
      if (instruction.entries && instruction.entries.length > 0) {
        const entry = instruction.entries[0]
        if (entry.content?.itemContent?.tweet_results?.result) {
          tweetData = entry.content.itemContent.tweet_results.result
          userResult = tweetData.core?.user_results?.result
          legacy = tweetData.legacy
          userLegacy = userResult?.legacy
          articleData = tweetData.article
          tweetId = legacy?.id_str || tweetData.rest_id || ''
          break
        }
      }
    }

    if (!tweetData || !legacy || !userLegacy) {
      console.log('Could not find valid tweet data in API response')
      return null
    }
    
    // Extract author information
    const authorName = userLegacy.name || ''
    const authorHandle = userLegacy.screen_name || ''
    const authorProfileImage = userLegacy.profile_image_url_https || ''
    
    // Extract article information
    const articleTitle = articleData?.article_results?.result?.title || ''
    const articlePreviewText = articleData?.article_results?.result?.preview_text || ''
    
    // Extract featured image
    const featuredImageUrl = articleData?.article_results?.result?.cover_media?.media_info?.original_img_url || ''
    
    // Extract tweet metadata
    const tweetUrl = tweetId && authorHandle ? `https://twitter.com/${authorHandle}/status/${tweetId}` : ''
    const createdAt = legacy.created_at || ''
    
    console.log('Extracted data overview:', {
      authorName,
      authorHandle,
      articleTitle,
      hasPreviewText: !!articlePreviewText,
      hasFeaturedImage: !!featuredImageUrl,
      hasCreatedAt: !!createdAt,
      tweetId
    })
    
    return {
      authorName,
      authorHandle,
      authorProfileImage,
      articleTitle,
      articlePreviewText,
      featuredImageUrl,
      tweetUrl,
      createdAt
    }
  } catch (error) {
    console.error('Error extracting data from tweet:', error)
    return null
  }
}

// Function to categorize content
function categorizeContent(authorName: string, authorHandle: string): string {
  const text = `${authorName} ${authorHandle}`.toLowerCase()
  
  if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('machine learning')) {
    return 'ai'
  } else if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum') || text.includes('blockchain') || text.includes('wallet') || text.includes('defi')) {
    return 'crypto'
  } else if (text.includes('tech') || text.includes('technology') || text.includes('software') || text.includes('programming')) {
    return 'tech'
  } else {
    return 'general'
  }
}

// Function to extract tags
function extractTags(category: string, authorName: string): string[] {
  const tags: string[] = []
  
  switch (category) {
    case 'ai':
      tags.push('ai', 'artificial-intelligence', 'machine-learning')
      break
    case 'crypto':
      tags.push('crypto', 'blockchain')
      if (authorName.toLowerCase().includes('wallet')) {
        tags.push('wallet', 'defi')
      }
      if (authorName.toLowerCase().includes('pump')) {
        tags.push('memecoin', 'pumpfun')
      }
      break
    case 'tech':
      tags.push('technology', 'software', 'innovation')
      break
    default:
      tags.push('insights', 'digital-age')
  }
  
  return tags
}

// Function to update article with correct format
async function updateArticleWithCorrectFormat(article: any, index: number) {
  try {
    // Get fresh tweet data
    const apiResponse = await getTweetData(article.tweet_id)
    if (!apiResponse) {
      console.error(`Failed to get tweet data for ${article.tweet_id}`)
      return false
    }
    
    // Extract real data from API response
    const realData = extractRealDataFromTweet(apiResponse)
    
    if (!realData) {
      console.error(`Failed to extract data from tweet ${article.tweet_id}`)
      return false
    }
    
    // Use real article title and content, fallback to generated if not available
    const title = realData.articleTitle || `Article by ${realData.authorName || 'Unknown'}`
    const content = realData.articlePreviewText || 'Content not available'
    const excerpt = content.length > 200 ? content.substring(0, 200) + '...' : content
    
    // Generate category and tags based on real author info
    const category = categorizeContent(realData.authorName, realData.authorHandle)
    const tags = extractTags(category, realData.authorName)
    const slug = generateSlug(title, article.tweet_id)
    
    // Parse created_at date
    let publishedAt = new Date().toISOString()
    if (realData.createdAt) {
      try {
        publishedAt = new Date(realData.createdAt).toISOString()
      } catch (e) {
        console.warn('Could not parse created_at date:', realData.createdAt)
      }
    }
    
    const updateData = {
      idx: index + 1,
      title: title,
      slug: slug,
      content: content,
      excerpt: excerpt,
      meta_title: title,
      meta_description: excerpt.replace('...', ''),
      featured_image_url: realData.featuredImageUrl || null,
      author_name: realData.authorName || article.author_name,
      author_handle: realData.authorHandle ? `@${realData.authorHandle}` : article.author_handle,
      author_profile_image: realData.authorProfileImage || null,
      article_url: realData.tweetUrl || article.article_url,
      category: category,
      tags: tags,
      status: 'published',
      published_at: publishedAt,
      article_published_at: publishedAt,
      updated_at: new Date().toISOString()
    }
    
    console.log(`Extracted data for ${article.tweet_id}:`)
    console.log(`- Title: ${title}`)
    console.log(`- Author: ${realData.authorName} (@${realData.authorHandle})`)
    console.log(`- Featured Image: ${realData.featuredImageUrl ? 'Found' : 'Not found'}`)
    console.log(`- Content Length: ${content.length} characters`)
    
    const { error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('tweet_id', article.tweet_id)
    
    if (error) {
      console.error('Error updating article:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error updating article with correct format:', error)
    return false
  }
}

// Main function
async function generateCorrectFormatArticles() {
  try {
    // Get all articles that need to be updated
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .not('tweet_id', 'is', null)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching articles:', error)
      return
    }
    
    if (!articles || articles.length === 0) {
      console.log('No articles found to update')
      return
    }
    
    console.log(`Found ${articles.length} articles to update with correct format`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]
      console.log(`\nProcessing ${i + 1}/${articles.length}: Tweet ${article.tweet_id}`)
      console.log(`Author: ${article.author_name} (${article.author_handle})`)
      
      const updated = await updateArticleWithCorrectFormat(article, i)
      if (updated) {
        console.log('Successfully updated article with correct format')
        successCount++
      } else {
        console.error('Failed to update article')
        errorCount++
      }
      
      // Rate limiting
      if (i < articles.length - 1) {
        console.log('Waiting 0.2 seconds before next request...');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`\n=== Update Complete ===`)
    console.log(`Successfully updated: ${successCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log(`Total: ${articles.length}`)
    
  } catch (error) {
    console.error('Error in main function:', error)
  }
}

// Run the script
generateCorrectFormatArticles().catch(console.error)
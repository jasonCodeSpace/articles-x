import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const rapidApiKey = process.env.RAPIDAPI_KEY!

// Test different API endpoints for articles
async function testArticleEndpoints() {
  const articleId = '1950723072262324225' // One of the article IDs
  
  const endpoints = [
    {
      name: 'article.php',
      url: `https://twitter-api45.p.rapidapi.com/article.php?id=${articleId}`
    },
    {
      name: 'article endpoint',
      url: `https://twitter-api45.p.rapidapi.com/article?id=${articleId}`
    },
    {
      name: 'articles endpoint',
      url: `https://twitter-api45.p.rapidapi.com/articles?id=${articleId}`
    },
    {
      name: 'tweet with article',
      url: `https://twitter-api45.p.rapidapi.com/tweet.php?id=1950732288754659694`
    }
  ]

  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': rapidApiKey,
      'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
    }
  }

  for (const endpoint of endpoints) {
    console.log(`\n=== Testing ${endpoint.name} ===`)
    console.log(`URL: ${endpoint.url}`)
    
    try {
      const response = await fetch(endpoint.url, options)
      console.log(`Status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Response data:')
        console.log(JSON.stringify(data, null, 2))
      } else {
        console.log(`Error: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.log('Error response:', errorText)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

// Test if we can get article content from the original tweet data
async function testTweetWithArticle() {
  console.log('\n=== Testing Tweet with Article Data ===')
  
  const tweetId = '1950732288754659694'
  const url = `https://twitter-api45.p.rapidapi.com/tweet.php?id=${tweetId}`
  
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': rapidApiKey,
      'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
    }
  }

  try {
    const response = await fetch(url, options)
    console.log(`Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('Tweet data structure:')
      console.log('Keys:', Object.keys(data))
      
      if (data.urls && data.urls.length > 0) {
        console.log('\nURLs found:')
        data.urls.forEach((url: any, index: number) => {
          console.log(`URL ${index + 1}:`, JSON.stringify(url, null, 2))
        })
      }
      
      // Look for any article-related fields
      const articleFields = ['article', 'articles', 'content', 'full_text', 'extended_text']
      articleFields.forEach(field => {
        if (data[field]) {
          console.log(`\n${field}:`, JSON.stringify(data[field], null, 2))
        }
      })
    } else {
      console.log(`Error: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run tests
async function runTests() {
  await testArticleEndpoints()
  await testTweetWithArticle()
}

runTests().catch(console.error)
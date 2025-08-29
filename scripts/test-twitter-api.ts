import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST!;

async function testTwitterAPI() {
  console.log('Testing Twitter API...');
  console.log('API Host:', RAPIDAPI_HOST);
  console.log('API Key:', RAPIDAPI_KEY ? 'Present' : 'Missing');
  
  // Test with a known tweet ID
  const testTweetId = '1948019311752151066';
  
  try {
    console.log(`\nTesting tweet ID: ${testTweetId}`);
    
    const response = await fetch(`https://${RAPIDAPI_HOST}/tweet?id=${testTweetId}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Tweet data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('Network error:', error);
  }
  
  // Test API endpoint availability
  console.log('\nTesting API endpoint availability...');
  try {
    const response = await fetch(`https://${RAPIDAPI_HOST}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });
    console.log('Endpoint status:', response.status);
  } catch (error) {
    console.error('Endpoint test error:', error);
  }
}

testTwitterAPI().catch(console.error);
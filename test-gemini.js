// Use global fetch (available in Node.js 18+)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API summary generation...');
    
    // Test actual summary generation directly
    const summaryResponse = await fetch('http://localhost:3000/api/generate-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        articleId: 'e507dee3-799c-4058-be92-dd6471423daf',
        content: 'Martin Armstrong ist ein international bekannter Finanzanalyst, Berater von Regierungen und Großbanken und Entwickler eines bekannten Wirtschafts- und Zyklenmodells. Auf TKP berichtet Dr. Peter Mayer über wichtige wirtschaftliche und politische Entwicklungen. Er warnt vor einem bevorstehenden Krieg und dem möglichen Zusammenbruch der EU. Armstrong prognostiziert schwere wirtschaftliche Turbulenzen und mögliche Enteignungen von Bürgern durch Regierungen.',
        title: 'Krieg soll stattfinden - EU vor Zusammenbruch - Enteignung steht bevor'
      })
    });
    
    console.log('Response status:', summaryResponse.status);
    console.log('Response headers:', Object.fromEntries(summaryResponse.headers.entries()));
    
    if (summaryResponse.ok) {
      const summaryResult = await summaryResponse.json();
      console.log('✅ Summary generation successful!');
      console.log('Result:', JSON.stringify(summaryResult, null, 2));
      
      if (summaryResult.summary) {
        console.log('\n📝 Generated Summaries:');
        console.log('English:', summaryResult.summary.english);
        console.log('Chinese:', summaryResult.summary.chinese);
      }
    } else {
      const errorText = await summaryResponse.text();
      console.log('❌ Summary generation failed!');
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testGeminiAPI();
// 由于是 TypeScript 项目，我们需要通过 API 来测试
const https = require('https');
const http = require('http');

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 测试文章内容
const testTitle = "OpenAI Releases GPT-4 Turbo with Enhanced AI Capabilities";
const testContent = `OpenAI has announced the release of GPT-4 Turbo, a new version of their flagship language model that offers significant improvements in performance and capabilities. The new model features enhanced reasoning abilities, better code generation, and improved understanding of complex instructions.

Key features of GPT-4 Turbo include:
- 128k context window for processing longer documents
- Improved accuracy in mathematical calculations
- Better performance on coding tasks
- Enhanced multilingual capabilities
- Reduced hallucination rates

The model is now available through OpenAI's API and will be integrated into ChatGPT Plus subscriptions. This release represents a major step forward in artificial intelligence technology and is expected to benefit developers, researchers, and businesses worldwide.

OpenAI CEO Sam Altman commented on the release, stating that GPT-4 Turbo represents the company's commitment to advancing AI safety and capability. The model has undergone extensive testing and alignment procedures to ensure responsible deployment.

Pricing for the new model starts at $0.01 per 1K input tokens and $0.03 per 1K output tokens, making it more cost-effective than previous versions while delivering superior performance.`;

async function testCategoryGeneration() {
  try {
    console.log('Testing category generation via API...');
    
    // 调用 generate-summaries API
    const url = 'http://localhost:3000/api/generate-summaries?secret=8abc70c86c185e42ab38bda85251ef43700ba99bea2a2199806a34df1c477489';
    const response = await makeRequest(url, 'POST');
    
    console.log('\n=== API Response ===');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    if (response.status === 200) {
      console.log('\n✅ API call successful!');
      console.log('Check the database for updated categories.');
    } else {
      console.log('\n❌ API call failed');
    }
    
  } catch (error) {
    console.error('Error testing category generation:', error);
  }
}

testCategoryGeneration();
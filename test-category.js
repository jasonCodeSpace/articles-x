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

// 测试文章内容 - 第一篇：PumpFun到Hyperliquid文章
const testTitle1 = "从 PumpFun 到 Hyperliquid：为何「回购销毁」在价值分配方面优于「收益共享」？";
const testContent1 = `作者：Techub 精选编译

撰文：Tim.0x

编译：Yangz，Techub News

大约一个月前，Crypto Twitter 上充斥着关于「收入」这一话题的探讨，强调了它对讨论其他方面的重要性。那时，我分享了这么一个观点，即收入本身与所有业务/行业都息息相关，我们并不应该将其作为一种「元」或「趋势」来讨论。在传统金融领域，一家初创公司的成功往往取决于其产品与市场契合度（PMF）和收入，而在我们这个行业（加密货币行业）里，这也不应有任何不同。

纵观当前火热的项目，你会发现那些收入可观的成功的协议都存在一些共同模式。在大多数情况下，它们要么执行回购计划，要么采用收益共享机制，以此来激活和支撑协议的经济体系。与此同时，其他一些协议虽然也采用了这些机制，但由于种种原因，仍未能取得成功。

到目前为止，一些项目方（例如 OKX）已经实施了回购销毁（buyback and burns）的策略，代币价格「水涨船高」；其他协议正在纷纷效仿，并将这一机制视为发展的蓝图。

什么是回购？

简单来说，回购与销毁是一种通过智能合约在协议上设计的机制，在预定时间，协议会从公开市场回购一定比例的流通代币，有时还会将其发送至一个无法检索的地址，这些代币将永远无法再参与流通。`;

// 第二篇：Weed Made Me Creative文章
const testTitle2 = "Weed Made Me Creative… and Destroyed My Life";
const testContent2 = `I used weed/marijuana for the past 12 years at different periods. Sometimes, in a few years, I had 2–3 months where I consumed daily. My initial exposure to weed happened through my co-founder of the first startup, who was located in Punjab, which is also called the drug capital of India.

It stated that some 15% (41 lakh people) of Punjab's population of 277.4 lakh are consuming some drug - The Hindu

Punjab has a long history of drug abuse. You see it in the villages, where farmers sit in groups with pipes and hash, and in the towns, where young boys smoke joints before heading to college. Addiction has torn through families. It has taken away entire generations of youth. At the same time, there is a strange normalization of it. Among many young men, smoking weed or hash is not seen as rebellion but as a casual part of growing up.

I lived in that culture for six months, and the environment seeped into me. Weed was easy to source, and it was celebrated among peers as something you must try. When you live in an atmosphere where it feels like a rite of passage, it is hard to resist. So I did not.

The Carefree Illusion

Those highs pushed me to try it again. There was a time I became a chain-smoker too, and weed smoking became more like an act of entertainment. We used to light joints just to have fun with friends and enjoy good food.`;

async function testCategoryGeneration() {
  try {
    console.log('测试文章分类生成...');
    
    // 测试第一篇文章：PumpFun到Hyperliquid
    console.log('\n=== 测试第一篇文章 ===');
    console.log('标题:', testTitle1);
    console.log('预期分类: Crypto, Tech (不应包含 Business)');
    
    const response1 = await makeRequest('http://localhost:3000/api/generate-categories', 'POST', {
      title: testTitle1,
      content: testContent1
    });
    
    console.log('响应状态:', response1.status);
    console.log('实际分类:', response1.data.categories);
    
    // 测试第二篇文章：Weed Made Me Creative
    console.log('\n=== 测试第二篇文章 ===');
    console.log('标题:', testTitle2);
    console.log('预期分类: Personal Story, Culture (不应包含 Tech)');
    
    const response2 = await makeRequest('http://localhost:3000/api/generate-categories', 'POST', {
      title: testTitle2,
      content: testContent2
    });
    
    console.log('响应状态:', response2.status);
    console.log('实际分类:', response2.data.categories);
    
    // 分析结果
    console.log('\n=== 分析结果 ===');
    if (response1.status === 200) {
      const cats1 = response1.data.categories;
      const hasBusiness = cats1.includes('Business');
      const hasCrypto = cats1.includes('Crypto');
      const hasTech = cats1.includes('Tech');
      
      console.log(`第一篇文章 - Crypto: ${hasCrypto ? '✅' : '❌'}, Tech: ${hasTech ? '✅' : '❌'}, Business: ${hasBusiness ? '❌ 不应包含' : '✅ 正确排除'}`);
    }
    
    if (response2.status === 200) {
      const cats2 = response2.data.categories;
      const hasPersonalStory = cats2.includes('Personal Story');
      const hasCulture = cats2.includes('Culture');
      const hasTech = cats2.includes('Tech');
      
      console.log(`第二篇文章 - Personal Story: ${hasPersonalStory ? '✅' : '❌'}, Culture: ${hasCulture ? '✅' : '❌'}, Tech: ${hasTech ? '❌ 不应包含' : '✅ 正确排除'}`);
    }
    
  } catch (error) {
    console.error('测试出错:', error.message);
  }
}

testCategoryGeneration();
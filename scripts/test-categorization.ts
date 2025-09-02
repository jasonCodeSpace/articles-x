#!/usr/bin/env tsx

import { generateArticleAnalysis } from '@/lib/gemini'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Test cases with expected categories
const testCases = [
  {
    title: "The Massacres Against Jews in Palestine's Civil War",
    content: "Historical analysis of conflicts and violence in Palestine during the civil war period. This article examines the political and social factors that led to massacres and international diplomatic responses.",
    expected: "International"
  },
  {
    title: "Tesla FSD in Australia: Testing unprotected right turns",
    content: "Tesla's Full Self-Driving technology is being tested in Australia with focus on unprotected right turns. The hardware and software systems are being evaluated for autonomous driving capabilities.",
    expected: "Hardware"
  },
  {
    title: "Foot Locker x Habbo partnership",
    content: "Foot Locker has partnered with the virtual world gaming platform Habbo to create branded virtual rooms and gaming experiences for users.",
    expected: "Gaming"
  },
  {
    title: "World Liberty Financial brings stablecoin to DeFi",
    content: "World Liberty Financial launched a new stablecoin protocol for decentralized finance, offering yield farming and lending services on various blockchain networks.",
    expected: "Defi"
  },
  {
    title: "Bitcoin reaches new all-time high",
    content: "Bitcoin price analysis shows the cryptocurrency reaching record highs amid institutional adoption and ETF approvals. Market analysts predict continued growth.",
    expected: "Bitcoin"
  }
]

async function testCategorization() {
  console.log('🧪 Testing Gemini AI categorization...\n')
  
  let correct = 0
  let total = testCases.length
  
  for (const testCase of testCases) {
    try {
      console.log(`📝 Testing: ${testCase.title}`)
      console.log(`   Expected: ${testCase.expected}`)
      
      const analysis = await generateArticleAnalysis(testCase.content, testCase.title)
      
      console.log(`   AI Result: ${analysis.category}`)
      console.log(`   Language: ${analysis.language}`)
      
      if (analysis.category === testCase.expected) {
        console.log(`   ✅ CORRECT\n`)
        correct++
      } else {
        console.log(`   ❌ INCORRECT - Expected ${testCase.expected}, got ${analysis.category}\n`)
      }
      
      // Wait to respect API limits
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error(`   💥 Error: ${error}\n`)
    }
  }
  
  console.log(`📊 Test Results: ${correct}/${total} correct (${Math.round(correct/total*100)}%)`)
  
  if (correct === total) {
    console.log('🎉 All tests passed! The categorization system is working correctly.')
  } else {
    console.log('⚠️ Some tests failed. The prompt may need further refinement.')
  }
}

async function main() {
  try {
    await testCategorization()
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

main()

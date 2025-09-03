import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

// 加载环境变量
dotenv.config({ path: '.env.local' })

async function testSimpleTranslation() {
  console.log('🔍 Testing Simple Translation...')
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const prompt = `Translate this Italian article to English. Follow this EXACT format:

LANGUAGE: it

Italian summary paragraph here.

English summary paragraph here.

CATEGORY: Media

ENGLISH_TRANSLATION:
TITLE: English title here
TWEET_TEXT: English tweet text here
PREVIEW_TEXT: English preview text here
FULL_CONTENT: English full content here

Article Title: Gaza, il mistero dei giornalisti: cronisti o ingranaggi della propaganda?

Article Content: C'è un dato che da solo racconta l'anomalia: Gaza, 2,2 milioni di abitanti, ha più giornalisti morti in dieci mesi della somma di Vietnam, Corea, Afghanistan e Jugoslavia. Non è una statistica, è un'anomalia che dovrebbe far riflettere.`
  
  try {
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    
    console.log('\n🤖 AI Response:')
    console.log(response)
    
    // Check if ENGLISH_TRANSLATION section exists
    if (response.includes('ENGLISH_TRANSLATION:')) {
      console.log('\n✅ SUCCESS: ENGLISH_TRANSLATION section found!')
      
      const translationMatch = response.match(/ENGLISH_TRANSLATION:[\s\S]*$/i)
      if (translationMatch) {
        const translationText = translationMatch[0]
        console.log('\n📝 Translation Section:')
        console.log(translationText)
        
        const previewMatch = translationText.match(/PREVIEW_TEXT:\s*([^\n]+)/i)
        if (previewMatch && previewMatch[1].trim()) {
          console.log('\n✅ PREVIEW_TEXT found:', previewMatch[1].trim())
        } else {
          console.log('\n❌ PREVIEW_TEXT missing or empty')
        }
      }
    } else {
      console.log('\n❌ FAILURE: ENGLISH_TRANSLATION section not found!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testSimpleTranslation()
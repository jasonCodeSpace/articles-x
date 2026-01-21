import { createClient } from '@supabase/supabase-js'
import { generateEnglishAnalysis, translateToChinese } from '@/lib/deepseek'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

async function generateSummary() {
  // 获取文章
  const { data: article, error: fetchError } = await supabase
    .from('articles')
    .select('*')
    .eq('tweet_id', '2013213200934723977')
    .single()

  if (fetchError || !article) {
    console.log('获取文章失败:', fetchError)
    return
  }

  console.log('文章 ID:', article.id)
  console.log('标题:', article.title)

  // 生成摘要
  console.log('\n生成摘要中...')
  const englishResult = await generateEnglishAnalysis(article.full_article_content, article.title, true)
  const summaryChinese = await translateToChinese(englishResult.summary_english)

  const updateData = {
    summary_english: englishResult.summary_english,
    summary_chinese: summaryChinese,
    title_english: englishResult.title_english,
    language: 'ar',
    summary_generated_at: new Date().toISOString()
  }

  console.log('\n更新数据...')
  const { data: updateResult, error: updateError } = await supabase
    .from('articles')
    .update(updateData)
    .eq('id', article.id)
    .select()

  if (updateError) {
    console.log('更新失败:', updateError)
  } else {
    console.log('更新成功, 影响行数:', updateResult?.length)
  }

  // 验证
  console.log('\n验证中...')
  const { data: verify } = await supabase
    .from('articles')
    .select('summary_english, summary_chinese')
    .eq('id', article.id)
    .single()

  if (verify?.summary_english) {
    console.log('✓ 验证成功，摘要已保存')
    console.log('\n英文摘要:', verify.summary_english.substring(0, 100) + '...')
    console.log('中文摘要:', verify.summary_chinese.substring(0, 100) + '...')
  } else {
    console.log('✗ 验证失败，摘要未保存')
  }
}

generateSummary().catch(console.error)

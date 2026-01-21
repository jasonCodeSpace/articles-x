import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

async function check() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('最新文章的列:')
  if (data && data.length > 0) {
    const columns = Object.keys(data[0])
    console.log(columns.join(', '))

    console.log('\n文章摘要状态:')
    data.forEach(a => {
      const summary = a.summary_en ?? a.summary_english ?? a.summary_zh ?? a.summary_chinese
      console.log(`- ${a.title.substring(0, 60)}... ${summary ? '✓ 有摘要' : '✗ 无摘要'}`)
    })
  }
}

check().catch(console.error)

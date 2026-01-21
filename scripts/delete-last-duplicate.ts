import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

async function deleteLastDuplicate() {
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', '172296bf-7958-4fc5-9eb5-ff15163c26aa')

  if (error) {
    console.error('删除失败:', error)
  } else {
    console.log('✓ 已删除最后1个重复')
  }
}

deleteLastDuplicate().catch(console.error)

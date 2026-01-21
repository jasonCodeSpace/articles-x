#!/usr/bin/env tsx
/**
 * Delete duplicate articles
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Duplicate article IDs to delete
const duplicateIds = [
  'f7b0e622-52f4-4e7f-8f14-852379f77e49', // วิธีกําจัดสิวเสี้ยน หยุดโดนการตลาดหลอก!
  '93ff8858-bd14-46a7-8c58-a99cdea1afac', // 〜しながら、をやめたら思考が戻ってきた話
  '26071964-521a-497e-8fa9-8fc5f1f404b1', // 罗永浩访谈刘震云：含着泪开完的玩笑
  'e117d96e-d944-45b6-8485-e7bbef292184', // 美国"股债汇"三杀！丹麦养老金"清仓美国"，黄金狂飙
  '2f334a80-e60f-4538-9c78-87638a06f60f', // 当华尔街还在争论，数字人民币先给用户"分钱"了
  'f0e26052-14d8-4e1f-be58-4f403a894691', // 副业平均月入五位数！我用三年时间验证的一些底层认知！
  '956d3a2e-a25a-4056-a09c-7f49f598f5f7', // 静默支付：比特币隐私的新时代
  '3219666d-5c5c-4ffd-a628-61c7322afa86', // 纽交所奇袭链上，代币化证券迎来"终局之战"？
  'a9ea345f-6c86-4a4e-b458-51460ddd7e05', // 凡是教你赚钱的，都是想赚你钱的吗？
  '69fe931a-a58c-4793-bde0-8da9efab205b', // 拆解 X 开源推荐算法，我们到底写什么内容才更吸引人？
  'c46e2786-86d7-4dc9-910c-bb4484ce2bac', // X 演算開源！細節全解析 - 優質內容創作者的高光時刻將至！
]

async function deleteDuplicates() {
  console.log('=== 删除重复文章 ===\n')

  // First, show what will be deleted
  const { data: articlesToDelete } = await supabase
    .from('articles')
    .select('id, title, tweet_id')
    .in('id', duplicateIds)

  if (articlesToDelete) {
    console.log('即将删除以下文章:')
    articlesToDelete.forEach(a => {
      console.log(`- ${a.title} (推文: ${a.tweet_id})`)
    })
  }

  // Confirm deletion
  console.log('\n删除中...')

  const { data, error } = await supabase
    .from('articles')
    .delete()
    .in('id', duplicateIds)
    .select()

  if (error) {
    console.error('删除失败:', error)
    return
  }

  console.log(`\n✓ 已删除 ${data?.length || 0} 篇重复文章`)
}

deleteDuplicates().catch(console.error)

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read extracted tweet IDs
const extractedTweetIdsPath = path.join(process.cwd(), 'extracted-tweet-ids.json');
const tweetIds = JSON.parse(fs.readFileSync(extractedTweetIdsPath, 'utf8'));

// Sample article data generator
function generateSampleArticle(tweetId: string, index: number) {
  const sampleTitles = [
    'AI革命：人工智能如何改变我们的未来',
    '区块链技术的最新发展与应用前景',
    '可持续发展：绿色科技的创新突破',
    '数字化转型：企业如何适应新时代',
    '量子计算：下一代计算技术的突破',
    '生物技术进展：医疗健康的新希望',
    '太空探索：人类向宇宙迈进的步伐',
    '新能源革命：清洁能源的未来发展',
    '智能制造：工业4.0的实现路径',
    '网络安全：数字时代的防护挑战'
  ];
  
  const sampleAuthors = [
    { name: 'Dr. 李明', handle: 'liming_tech', avatar: 'https://example.com/avatar1.jpg' },
    { name: '张教授', handle: 'prof_zhang', avatar: 'https://example.com/avatar2.jpg' },
    { name: '王研究员', handle: 'researcher_wang', avatar: 'https://example.com/avatar3.jpg' },
    { name: 'Sarah Chen', handle: 'sarah_chen', avatar: 'https://example.com/avatar4.jpg' },
    { name: 'Alex Kim', handle: 'alex_kim_tech', avatar: 'https://example.com/avatar5.jpg' }
  ];
  
  const sampleCategories = ['科技', '创新', '研究', '发展', '未来'];
  
  const title = sampleTitles[index % sampleTitles.length];
  const author = sampleAuthors[index % sampleAuthors.length];
  const category = sampleCategories[index % sampleCategories.length];
  
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Math.random().toString(36).substr(2, 9);
  
  const now = new Date();
  const publishedAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days
  
  return {
    title,
    slug: `${slug}-${tweetId}`,
    author_name: author.name,
    image: `https://example.com/article-image-${index + 1}.jpg`,
    author_handle: author.handle,
    author_avatar: author.avatar,
    article_published_at: publishedAt.toISOString(),
    article_url: `https://example.com/articles/${slug}-${tweetId}`,
    updated_at: now.toISOString(),
    category,
    tweet_id: tweetId,
    tweet_text: `这是关于${title}的精彩讨论。通过深入分析和研究，我们发现了许多有趣的见解和发展趋势。#${category} #科技创新`,
    tweet_published_at: publishedAt.toISOString(),
    tweet_views: Math.floor(Math.random() * 100000) + 1000,
    tweet_replies: Math.floor(Math.random() * 500) + 10,
    tweet_retweets: Math.floor(Math.random() * 1000) + 50,
    tweet_likes: Math.floor(Math.random() * 5000) + 100,
    tweet_bookmarks: Math.floor(Math.random() * 500) + 20,
    article_preview_text: `${title}是当前最热门的话题之一。本文将深入探讨相关技术发展、应用场景以及未来趋势，为读者提供全面的分析和见解。`,
    full_article_content: `# ${title}\n\n## 引言\n\n在当今快速发展的科技时代，${title.toLowerCase()}已经成为了一个备受关注的话题。本文将从多个角度深入分析这一领域的最新发展。\n\n## 主要内容\n\n### 技术背景\n\n随着技术的不断进步，我们看到了许多令人兴奋的发展。这些进步不仅改变了我们的工作方式，也影响了我们的日常生活。\n\n### 应用场景\n\n在实际应用中，这些技术已经在多个领域展现出了巨大的潜力：\n\n1. **教育领域**：提供个性化学习体验\n2. **医疗健康**：改善诊断和治疗效果\n3. **商业应用**：优化业务流程和决策\n4. **社会服务**：提升公共服务质量\n\n### 未来展望\n\n展望未来，我们可以预期这一领域将继续快速发展，带来更多创新和机遇。\n\n## 结论\n\n总的来说，${title.toLowerCase()}代表了科技发展的重要方向，值得我们持续关注和深入研究。\n\n---\n\n*本文由${author.name}撰写，首发于X平台。*`
  };
}

async function insertSampleArticles() {
  console.log(`开始生成并插入${tweetIds.length}条示例文章数据...`);
  
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < tweetIds.length; i += batchSize) {
    const batch = tweetIds.slice(i, i + batchSize);
    const articles = batch.map((tweetId: string, index: number) => 
      generateSampleArticle(tweetId, i + index)
    );
    
    try {
      const { data, error } = await supabase
        .from('articles')
        .insert(articles);
      
      if (error) {
        console.error(`批次 ${Math.floor(i / batchSize) + 1} 插入失败:`, error.message);
        errorCount += batch.length;
      } else {
        console.log(`批次 ${Math.floor(i / batchSize) + 1} 成功插入 ${batch.length} 条记录`);
        successCount += batch.length;
      }
    } catch (err) {
      console.error(`批次 ${Math.floor(i / batchSize) + 1} 处理失败:`, err);
      errorCount += batch.length;
    }
    
    // 添加延迟以避免过快请求
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n数据插入完成:`);
  console.log(`成功插入: ${successCount} 条`);
  console.log(`失败: ${errorCount} 条`);
  console.log(`总计: ${tweetIds.length} 条`);
}

// 执行插入
insertSampleArticles().catch(console.error);
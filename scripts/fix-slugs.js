const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 从url-utils.ts复制的generateSlugFromTitle函数
function generateSlugFromTitle(title) {
  if (!title || title.trim().length === 0) {
    return 'article';
  }

  // Check if title contains CJK characters
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff]/;
  const hasCJK = cjkRegex.test(title);
  
  if (hasCJK) {
    // For CJK text, transliterate to ASCII if possible, otherwise use romanization
    let processedTitle = title
      .replace(/[\u4e00-\u9fff]/g, (char) => {
        // Simple mapping for common Chinese characters to pinyin
        const pinyinMap = {
          '人': 'ren', '工': 'gong', '智': 'zhi', '能': 'neng', '的': 'de',
          '未': 'wei', '来': 'lai', '发': 'fa', '展': 'zhan', '趋': 'qu', '势': 'shi'
        };
        return pinyinMap[char] ? pinyinMap[char] + '-' : char;
      })
      .replace(/[\u3040-\u309f\u30a0-\u30ff]/g, (char) => {
        // Simple mapping for common Japanese characters to romaji
        const romajiMap = {
          'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
          'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
          'に': 'ni', 'つ': 'tsu', 'て': 'te'
        };
        return romajiMap[char] ? romajiMap[char] + '-' : char;
      })
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove remaining non-ASCII characters
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    if (!processedTitle || processedTitle.length < 1) {
      return 'article';
    }
    
    return processedTitle.substring(0, 50).replace(/-+$/, '');
  }
  
  // For non-CJK text, use improved logic with better word separation
  let slug = title
    .toLowerCase()
    .trim()
    // First, normalize common punctuation to spaces to preserve word boundaries
    .replace(/['"''""]/g, '') // Remove quotes
    .replace(/[.,!?;:()\[\]{}]/g, ' ') // Replace punctuation with spaces
    .replace(/[&+]/g, ' and ') // Replace & and + with 'and'
    .replace(/[@#$%^*=|\\/<>]/g, ' ') // Replace other special chars with spaces
    // Handle common contractions and abbreviations
    .replace(/\b(can't|won't|don't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|wouldn't|shouldn't|couldn't)\b/g, (match) => {
      const contractions = {
        "can't": "cannot", "won't": "will-not", "don't": "do-not", 
        "isn't": "is-not", "aren't": "are-not", "wasn't": "was-not", 
        "weren't": "were-not", "hasn't": "has-not", "haven't": "have-not", 
        "hadn't": "had-not", "wouldn't": "would-not", "shouldn't": "should-not", 
        "couldn't": "could-not"
      };
      return contractions[match] || match;
    })
    // Remove remaining non-alphanumeric characters except spaces and existing hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Normalize whitespace and convert to hyphens
    .replace(/\s+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // If slug is empty or too short, return 'article'
  if (!slug || slug.length < 1) {
    return 'article';
  }

  // Limit length to 50 characters and ensure it doesn't end with a hyphen
  if (slug.length > 50) {
    // Find the last complete word within 50 characters
    const truncated = slug.substring(0, 50);
    const lastHyphenIndex = truncated.lastIndexOf('-');
    if (lastHyphenIndex > 20) { // Only truncate at word boundary if it's not too short
      slug = truncated.substring(0, lastHyphenIndex);
    } else {
      slug = truncated;
    }
  }
  
  return slug.replace(/-+$/, ''); // Remove any trailing hyphens
}

function generateShortId(uuid) {
  return uuid.substring(uuid.length - 6);
}

async function fixSlugs() {
  try {
    console.log('开始修复错误的slug...');
    
    // 首先验证连接
    const { data: testData, error: testError } = await supabase
      .from('articles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('数据库连接失败:', testError);
      return;
    }
    
    console.log('数据库连接成功');
    
    // 需要修复的文章
    const articlesToFix = [
      {
        id: 'ab416dd2-6266-40b5-92c0-cc9d6aa7fb79',
        title: 'August 2025 Recap — Speed, Scale & the $CXT Onchain Flywheel',
        oldSlug: 'covalentsaugust2025recapacceleratinggrowththroughon-chaininnovation--ab416d'
      },
      {
        id: '989e84b1-35b3-4c30-8537-46f695deb475',
        title: 'Gold and silver see momentum as the market expects a weakening dollar',
        oldSlug: 'preciousmetalssurgegoldhitsrecordhighasdollarweaknesslooms--989e84'
      }
    ];
    
    for (const article of articlesToFix) {
      // 首先查询当前文章信息
      const { data: currentData, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, slug')
        .eq('id', article.id)
        .single();
      
      if (fetchError) {
        console.error(`查询文章失败 (${article.id}):`, fetchError);
        continue;
      }
      
      console.log(`当前文章信息:`);
      console.log(`  ID: ${currentData.id}`);
      console.log(`  标题: ${currentData.title}`);
      console.log(`  当前slug: ${currentData.slug}`);
      
      // 生成正确的slug
      const baseSlug = generateSlugFromTitle(article.title);
      const shortId = generateShortId(article.id);
      const newSlug = `${baseSlug}--${shortId}`;
      
      console.log(`  新slug: ${newSlug}`);
      
      if (currentData.slug === newSlug) {
        console.log(`  ✅ slug已经正确，无需更新`);
        console.log('');
        continue;
      }
      
      // 更新数据库
      const { data: updateData, error: updateError } = await supabase
        .from('articles')
        .update({ slug: newSlug })
        .eq('id', article.id)
        .select();
      
      if (updateError) {
        console.error(`  ❌ 更新失败:`, updateError);
      } else {
        console.log(`  ✅ 更新成功`);
        console.log(`  更新后数据:`, updateData);
      }
      
      console.log('');
    }
    
    console.log('slug修复完成!');
    
    // 验证更新结果
    console.log('\n验证更新结果:');
    for (const article of articlesToFix) {
      const { data: verifyData, error: verifyError } = await supabase
        .from('articles')
        .select('id, title, slug')
        .eq('id', article.id)
        .single();
      
      if (verifyError) {
        console.error(`验证失败 (${article.id}):`, verifyError);
      } else {
        console.log(`${article.id}: ${verifyData.slug}`);
      }
    }
    
  } catch (error) {
    console.error('修复过程中出错:', error);
  }
}

// 运行修复脚本
fixSlugs();
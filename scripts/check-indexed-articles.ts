import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkArticles() {
  // Check total articles
  const { count: total } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  console.log('Total articles:', total || 0);

  // Check indexed articles with score >= 65
  const { count: indexed } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('indexed', true)
    .gte('score', 65);

  console.log('Indexed articles with score >= 65:', indexed || 0);

  // Check articles with score >= 65 (regardless of indexed)
  const { count: highScore } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .gte('score', 65);

  console.log('Articles with score >= 65 (any indexed status):', highScore || 0);

  // Check some sample articles
  const { data: samples } = await supabase
    .from('articles')
    .select('id, title, score, indexed')
    .order('score', { ascending: false })
    .limit(10);

  console.log('\nTop 10 articles by score:');
  samples?.forEach((a: any) => {
    console.log(`- ${a.title?.substring(0, 40)}... (score: ${a.score}, indexed: ${a.indexed})`);
  });
}

checkArticles().catch(console.error);

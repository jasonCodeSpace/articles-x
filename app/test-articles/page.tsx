import { createClient } from '@/lib/supabase/server'

export default async function TestArticles() {
  const supabase = await createClient()
  
  // Test different tag queries
  const [dayArticles, weekArticles, bothArticles] = await Promise.all([
    supabase.from('articles').select('id, title, tag, article_published_at').eq('tag', 'Day').limit(5),
    supabase.from('articles').select('id, title, tag, article_published_at').eq('tag', 'Week').limit(5),
    supabase.from('articles').select('id, title, tag, article_published_at').in('tag', ['Day', 'Week']).limit(10)
  ])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Articles Test Page</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Day Articles ({dayArticles.data?.length || 0})</h2>
          <div className="space-y-2">
            {dayArticles.data?.map(article => (
              <div key={article.id} className="p-3 border rounded">
                <p className="font-medium">{article.title}</p>
                <p className="text-sm text-gray-600">Tag: {article.tag} | Published: {new Date(article.article_published_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Week Articles ({weekArticles.data?.length || 0})</h2>
          <div className="space-y-2">
            {weekArticles.data?.map(article => (
              <div key={article.id} className="p-3 border rounded">
                <p className="font-medium">{article.title}</p>
                <p className="text-sm text-gray-600">Tag: {article.tag} | Published: {new Date(article.article_published_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Both Day + Week Articles ({bothArticles.data?.length || 0})</h2>
          <div className="space-y-2">
            {bothArticles.data?.map(article => (
              <div key={article.id} className="p-3 border rounded">
                <p className="font-medium">{article.title}</p>
                <p className="text-sm text-gray-600">Tag: {article.tag} | Published: {new Date(article.article_published_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Test Links:</h3>
        <div className="space-y-2">
          <a href="/trending" className="block text-blue-600 hover:underline">Today (Day articles only)</a>
          <a href="/trending?filter=week" className="block text-blue-600 hover:underline">This Week (Day + Week articles)</a>
        </div>
      </div>
    </div>
  )
}

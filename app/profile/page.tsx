import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Article } from '@/components/article-card'
import { Calendar, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  // Get categories for nav
  const { data: categoriesData } = await supabase
    .from('articles')
    .select('category')
    .not('category', 'is', null)
  
  const categories = [...new Set(categoriesData?.map(item => item.category) || [])]

  // Pagination logic
  const resolvedSearchParams = await searchParams
  const currentPage = parseInt(resolvedSearchParams.page || '1', 10)
  const itemsPerPage = 10
  const offset = (currentPage - 1) * itemsPerPage

  // Get total count of bookmarks
  const { count: totalBookmarks } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get user's bookmarked articles with pagination
  const { data: bookmarksData, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      articles (
        id,
        title,
        slug,
        author_name,
        author_handle,
        author_avatar,
        image,
        article_published_at,
        category,
        article_url,
        tweet_id,
        tweet_text,
        tweet_published_at,
        tweet_views,
        tweet_replies,
        tweet_retweets,
        tweet_likes,
        tweet_bookmarks,
        article_preview_text,
        full_article_content,
        updated_at,
        summary_chinese,
        summary_english,
        summary_generated_at,
        language,
        title_english,
        article_preview_text_english,
        full_article_content_english,
        tag
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + itemsPerPage - 1)

  if (bookmarksError) {
    console.error('Error fetching bookmarks:', bookmarksError)
  }

  console.log('Bookmarks data:', JSON.stringify(bookmarksData, null, 2))
  
  const bookmarkedArticles = (bookmarksData?.map(bookmark => {
    const article = Array.isArray(bookmark.articles) ? bookmark.articles[0] : bookmark.articles
    if (!article) return null
    // Add missing fields with defaults to match Article interface
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      author_name: article.author_name,
      author_handle: article.author_handle,
      author_avatar: article.author_avatar,
      image: article.image,
      featured_image_url: article.image,
      article_published_at: article.article_published_at,
      created_at: article.article_published_at || new Date().toISOString(),
      tags: article.tag ? [article.tag] : [],
      content: article.full_article_content || article.article_preview_text || '',
      excerpt: article.article_preview_text || '',
      category: article.category,
      article_url: article.article_url,
      tweet_id: article.tweet_id,
      tweet_text: article.tweet_text,
      tweet_published_at: article.tweet_published_at,
      tweet_views: article.tweet_views,
      tweet_replies: article.tweet_replies,
      tweet_retweets: article.tweet_retweets,
      tweet_likes: article.tweet_likes,
      tweet_bookmarks: article.tweet_bookmarks,
      article_preview_text: article.article_preview_text,
      full_article_content: article.full_article_content,
      updated_at: article.updated_at,
      summary_chinese: article.summary_chinese,
      summary_english: article.summary_english,
      summary_generated_at: article.summary_generated_at,
      language: article.language,
      title_english: article.title_english,
      article_preview_text_english: article.article_preview_text_english,
      full_article_content_english: article.full_article_content_english
    } as Article
  }).filter(Boolean) || []) as Article[]

  // Get user stats
  const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const userInitial = userDisplayName.charAt(0).toUpperCase()
  const joinDate = new Date(user.created_at)
  // const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null

  return (
    <div className="min-h-screen bg-background">
      <ClientNavWrapper initialUser={user} categories={categories} />
      
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        {/* Profile Header */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-border">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                  {user.user_metadata?.avatar_url ? (
                    <AvatarImage src={user.user_metadata.avatar_url} alt={userDisplayName} />
                  ) : null}
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-foreground mb-2">{userDisplayName}</h1>
                  <p className="text-muted-foreground text-lg mb-4">{user.email}</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDistanceToNow(joinDate, { addSuffix: true })}</span>
                    </div>

                  </div>
                </div>


              </div>
            </CardContent>
          </Card>
        </div>

        

        {/* Bookmarked Articles Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Bookmark className="h-6 w-6" />
                Bookmarked Articles ({bookmarkedArticles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookmarkedArticles.length > 0 ? (
                <div className="bg-muted/50 rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                                             <thead className="bg-muted">
                         <tr>
                           <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                             Title
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                             Description
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                             Author
                           </th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-border">
                        {bookmarkedArticles.map((article) => {
                          return (
                            <tr key={article.id} className="hover:bg-accent/50">
                              <td className="px-6 py-4 max-w-xs">
                                 <Link 
                                   href={`/article/${article.slug}`} 
                                   className="text-foreground hover:text-primary text-sm leading-tight block overflow-hidden"
                                   style={{
                                     display: '-webkit-box',
                                     WebkitLineClamp: 2,
                                     WebkitBoxOrient: 'vertical',
                                     lineHeight: '1.4em',
                                     maxHeight: '2.8em',
                                     fontSize: '14px'
                                   }}
                                 >
                                   {article.title}
                                 </Link>
                               </td>
                               <td className="px-6 py-4 max-w-md">
                                 {article.excerpt && (
                                   <Link 
                                     href={`/article/${article.slug}`} 
                                     className="text-muted-foreground hover:text-primary text-sm leading-tight block overflow-hidden"
                                     style={{
                                       display: '-webkit-box',
                                       WebkitLineClamp: 2,
                                       WebkitBoxOrient: 'vertical',
                                       lineHeight: '1.4em',
                                       maxHeight: '2.8em',
                                       fontSize: '14px'
                                     }}
                                   >
                                     {article.excerpt}
                                   </Link>
                                 )}
                               </td>
                               <td className="px-6 py-4">
                                  {article.author_handle ? (
                                    <Link 
                                      href={`/author/${article.author_handle}`} 
                                      className="text-muted-foreground hover:text-primary text-sm"
                                      style={{ fontSize: '14px' }}
                                    >
                                      {article.author_name}
                                    </Link>
                                  ) : (
                                    <span className="text-muted-foreground text-sm" style={{ fontSize: '14px' }}>
                                      {article.author_name}
                                    </span>
                                  )}
                                </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                   </div>
                   
                   {/* Pagination */}
                   {totalBookmarks && totalBookmarks > itemsPerPage && (
                     <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                       <div className="text-sm text-muted-foreground">
                         显示 {Math.min(offset + 1, totalBookmarks)} - {Math.min(offset + itemsPerPage, totalBookmarks)} 条，共 {totalBookmarks} 条
                       </div>
                       <div className="flex items-center space-x-2">
                         {currentPage > 1 && (
                           <Link
                             href={`/profile?page=${currentPage - 1}`}
                             className="flex items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent/50"
                           >
                             <ChevronLeft className="w-4 h-4 mr-1" />
                             上一页
                           </Link>
                         )}
                         
                         <span className="text-sm text-muted-foreground">
                           第 {currentPage} 页，共 {Math.ceil((totalBookmarks || 0) / itemsPerPage)} 页
                         </span>
                         
                         {currentPage < Math.ceil((totalBookmarks || 0) / itemsPerPage) && (
                           <Link
                             href={`/profile?page=${currentPage + 1}`}
                             className="flex items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent/50"
                           >
                             下一页
                             <ChevronRight className="w-4 h-4 ml-1" />
                           </Link>
                         )}
                       </div>
                     </div>
                   )}
                 </div>
              ) : (
                <div className="text-center py-12">
                  <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Bookmarks Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start bookmarking articles you want to read later or revisit.
                  </p>
                  <Button asChild>
                    <a href="/new">Browse Articles</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

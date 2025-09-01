import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArticleCard, Article } from '@/components/article-card'
import { User, Calendar, Settings, Activity, Bookmark } from 'lucide-react'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

export default async function ProfilePage() {
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

  // Get user's bookmarked articles
  const { data: bookmarksData } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      articles (
        id,
        title,
        slug,
        content,
        excerpt,
        author_name,
        author_handle,
        author_avatar,
        featured_image_url,
        image,
        article_published_at,
        created_at,
        tags,
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

  const bookmarkedArticles = (bookmarksData?.map(bookmark => bookmark.articles).filter(Boolean).flat() || []) as Article[]

  // Get user stats
  const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const userInitial = userDisplayName.charAt(0).toUpperCase()
  const joinDate = new Date(user.created_at)
  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null

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

                {/* Action Button */}
                <div>
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarkedArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                    />
                  ))}
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

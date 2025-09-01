import { createClient } from '@/lib/supabase/server'
import { ClientNavWrapper } from '@/components/client-nav-wrapper'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditProfileDialog } from '@/components/edit-profile-dialog'
import { User, Calendar, Settings, Activity } from 'lucide-react'
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

  // Get user stats (articles they've interacted with, etc.)
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
                  <EditProfileDialog user={user} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">User ID</span>
                <span className="text-foreground font-mono text-xs">{user.id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Account Created</span>
                <span className="text-foreground">{joinDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Email Verified</span>
                <span className={`text-sm font-medium ${user.email_confirmed_at ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user.email_confirmed_at ? 'Verified' : 'Pending'}
                </span>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  )
}

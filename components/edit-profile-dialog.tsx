'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Settings, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface EditProfileDialogProps {
  user: {
    id: string
    email?: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export function EditProfileDialog({ user }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(user.user_metadata?.avatar_url || '')
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl,
        }
      })

      if (error) {
        toast.error('Failed to update profile: ' + error.message)
      } else {
        toast.success('Profile updated successfully!')
        setOpen(false)
        router.refresh()
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Changes will be saved to your account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Avatar Preview */}
          <div className="flex items-center justify-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} alt={fullName || 'User'} />
              <AvatarFallback className="text-lg">
                {fullName ? fullName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Full Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fullName" className="text-right">
              Name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="col-span-3"
              placeholder="Enter your full name"
            />
          </div>
          
          {/* Avatar URL */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="avatarUrl" className="text-right">
              Avatar URL
            </Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="col-span-3"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>• Enter a direct URL to an image for your avatar</p>
            <p>• Recommended size: 200x200 pixels or larger</p>
            <p>• Supported formats: JPG, PNG, GIF, WebP</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
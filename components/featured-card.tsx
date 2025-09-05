'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BookmarkButton } from '@/components/bookmark-button'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export function FeaturedCard() {
  const [relativeTime, setRelativeTime] = useState<string>('Loading...')
  const [currentTitle, setCurrentTitle] = useState<string>('Loading...')
  const [description, setDescription] = useState<string>('Loading daily summary...')
  
  // Use useEffect to calculate relative time and generate title on client side
  useEffect(() => {
    // Fetch the latest daily summary to get the actual creation time
    const fetchSummaryTime = async () => {
      try {
        const response = await fetch('/api/daily-summary')
        if (response.ok) {
          const data = await response.json()
          if (data.summary && data.summary.created_at) {
            const createdAt = new Date(data.summary.created_at)
            const now = new Date()
            const diffInHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
            
            if (diffInHours < 1) {
              const diffInMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60))
              setRelativeTime(`${diffInMinutes}m`)
            } else if (diffInHours < 24) {
              setRelativeTime(`${diffInHours}h`)
            } else {
              const diffInDays = Math.floor(diffInHours / 24)
              setRelativeTime(`${diffInDays}d`)
            }
          } else {
            setRelativeTime('2h') // fallback
          }
        } else {
          setRelativeTime('2h') // fallback
        }
      } catch (error) {
        console.error('Failed to fetch summary time:', error)
        setRelativeTime('2h') // fallback
      }
    }
    
    fetchSummaryTime()
    
    // Generate current date title in format "Sept. 5 Summary"
    const today = new Date()
    const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.',
                       'Jul.', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.']
    const month = monthNames[today.getMonth()]
    const day = today.getDate()
    setCurrentTitle(`${month} ${day} Summary`)
    
    // Fetch Gemini-generated description
    const fetchDescription = async () => {
      try {
        const response = await fetch('/api/generate-daily-description')
        if (response.ok) {
          const data = await response.json()
          setDescription(data.description)
        } else {
          // Fallback description
          setDescription('Discover today\'s most insightful articles from leading voices on X. Curated highlights covering tech, business, crypto, and culture with clean, focused reading.')
        }
      } catch (error) {
        console.error('Failed to fetch description:', error)
        // Fallback description
        setDescription('Discover today\'s most insightful articles from leading voices on X. Curated highlights covering tech, business, crypto, and culture with clean, focused reading.')
      }
    }
    
    fetchDescription()
  }, [])

  // Fixed data for the featured card
  const featuredData = {
    id: 'featured-card',
    title: currentTitle,
    author_name: 'xarticle',
    author_handle: 'xarticle',
    image: '/image.webp',
    author_avatar: '/logo.svg',
    article_url: '/summary' // Link to daily summary page
  }

  const authorInitials = 'XA'

  return (
    <Link href={featuredData.article_url} className="block">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:bg-card/90 hover:border-border/80 transition-all duration-300 group cursor-pointer shadow-xl hover:shadow-2xl hover:scale-[1.02] flex flex-col h-[480px]">
        {/* Featured image at the top */}
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={featuredData.image}
            alt={`Cover for ${featuredData.title}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
            loading="eager"
            unoptimized
            referrerPolicy="no-referrer"
          />
        </div>
        
        {/* Card content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Article title */}
          <h3 className="text-foreground text-lg font-semibold leading-tight line-clamp-2 group-hover:text-accent-foreground transition-colors duration-200 mb-3">
            {featuredData.title}
          </h3>
          
          {/* Article preview text */}
          <div className="flex-grow">
            <p className="text-muted-foreground/15 text-xs leading-relaxed line-clamp-3 mb-4 hover:text-muted-foreground/25 transition-colors">
              {description}
            </p>
          </div>
          
          {/* Author info and bookmark button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 ring-1 ring-border">
                <AvatarImage 
                  src={featuredData.author_avatar} 
                  alt={`${featuredData.author_name} profile picture`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="text-xs font-medium bg-muted text-foreground">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-muted-foreground truncate hover:text-foreground transition-colors">
                @{featuredData.author_handle}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                <span>·</span>
                <time>
                  {relativeTime}
                </time>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <BookmarkButton articleId={featuredData.id} variant="card" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
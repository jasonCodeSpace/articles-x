'use client'

import React, { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink, Clock, Calendar, Share2, Globe } from 'lucide-react'
import { BookmarkButton } from '@/components/bookmark-button'
import { useRouter } from 'next/navigation'
import { FadeIn } from './motion-wrapper'
import { Button } from '@/components/ui/button'

const XIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
)

interface ArticleContentProps {
  article: {
    id: string
    title: string
    title_english?: string
    author_name: string
    author_handle?: string
    author_avatar?: string
    article_published_at?: string
    updated_at: string
    image?: string
    category?: string
    article_url?: string
    full_article_content?: string
    full_article_content_english?: string
    summary_english?: string
    summary_chinese?: string
    summary_generated_at?: string
  }
  authorInitials: string
  authorHandle: string
  avatarUrl?: string
  publishedDate?: string
  relativeTime: string
}

export function ArticleContent({
  article,
  authorInitials,
  authorHandle,
  avatarUrl,
  publishedDate,
  relativeTime
}: ArticleContentProps) {
  const router = useRouter()
  const [readingProgress, setReadingProgress] = useState(0)
  const [displayLanguage, setDisplayLanguage] = useState<'en' | 'cn'>('en')

  useEffect(() => {
    const updateReadingProgress = () => {
      const currentProgress = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight) {
        setReadingProgress(Number((currentProgress / scrollHeight).toFixed(2)) * 100)
      }
    }

    window.addEventListener('scroll', updateReadingProgress)
    return () => window.removeEventListener('scroll', updateReadingProgress)
  }, [])

  // Display title based on language preference
  const displayTitle = displayLanguage === 'en'
    ? (article.title_english || article.title)
    : article.title

  // Display summary based on language preference
  const displaySummary = displayLanguage === 'en'
    ? article.summary_english
    : article.summary_chinese

  // Check if both languages are available for summary
  const hasBothLanguages = article.summary_english && article.summary_chinese

  // Format article content with proper paragraphs
  const formatContent = (content: string | undefined): string => {
    if (!content) return ''

    // Split by double newlines for paragraphs
    return content
      .split(/\n\n+/)
      .filter(para => para.trim())
      .map(para => {
        // Replace single newlines with <br> within paragraphs
        const formatted = para.trim().replace(/\n/g, '<br />')
        return `<p class="mb-6">${formatted}</p>`
      })
      .join('')
  }

  // Get the content to display based on language preference
  const getDisplayContent = (): string => {
    const content = displayLanguage === 'en'
      ? (article.full_article_content_english || article.full_article_content)
      : (article.full_article_content || article.full_article_content_english)
    return formatContent(content)
  }

  return (
    <div className="relative">
      {/* Reading Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-[2px] bg-white/5 z-[60]">
        <div
          className="h-full bg-white transition-all duration-150 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <FadeIn direction="none" delay={0.1}>
        <header className="mb-16 space-y-8">
          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
            <span className="flex items-center gap-2">
              <Calendar size={12} />
              {new Date(publishedDate || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <Clock size={12} />
              {relativeTime}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            {displayTitle}
          </h1>

          <div className="flex items-center justify-between pt-8 border-t border-white/5">
            <div
              className="flex items-center gap-4 cursor-pointer group"
              onClick={() => router.push(`/author/${authorHandle}`)}
            >
              <Avatar className="h-12 w-12 border border-white/10 transition-transform duration-500 group-hover:scale-110">
                {avatarUrl && <AvatarImage src={avatarUrl} referrerPolicy="no-referrer" />}
                <AvatarFallback className="bg-white/5 text-white/30 text-sm font-bold">{authorInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white group-hover:text-white/80 transition-colors">{article.author_name}</span>
                <span className="text-xs text-white/30">@{authorHandle}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <BookmarkButton articleId={article.id} variant="page" />
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${encodeURIComponent(displayTitle)}`, '_blank')}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </header>
      </FadeIn>

      {/* Summary Section */}
      {displaySummary && (
        <FadeIn delay={0.2} distance={20}>
          <div className="mb-12 p-8 rounded-[2rem] bg-white/[0.03] border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">
                AI Summary
              </h2>
              {hasBothLanguages && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDisplayLanguage(displayLanguage === 'en' ? 'cn' : 'en')}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white hover:bg-white/5"
                >
                  <Globe size={12} />
                  {displayLanguage === 'en' ? 'EN' : 'CN'}
                </Button>
              )}
            </div>
            <div className="text-white/60 leading-relaxed whitespace-pre-line">
              {displaySummary}
            </div>
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.3} distance={20}>
        <article className="prose prose-invert prose-lg max-w-none">
          {article.full_article_content || article.full_article_content_english ? (
            <div
              className="text-white/70 leading-[1.9] font-light text-lg selection:bg-white/20"
              dangerouslySetInnerHTML={{ __html: getDisplayContent() }}
            />
          ) : (
            <div className="p-12 rounded-[2rem] bg-white/[0.03] border border-white/5 text-center">
              <p className="text-white/30 italic text-lg leading-relaxed">
                Full content is unavailable. Read the original on X.
              </p>
            </div>
          )}
        </article>
      </FadeIn>

      <FadeIn delay={0.5} className="mt-4 pt-4 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-widest text-white/20 font-bold">Source</span>
            {article.article_url && (
              <a
                href={article.article_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <XIcon size={14} />
                </div>
                <span className="text-sm font-medium">Read original article on X</span>
                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </a>
            )}
          </div>

          {/* Author attribution for EEAT */}
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-white/20 font-bold">By</span>
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => router.push(`/author/${authorHandle}`)}
            >
              <Avatar className="h-8 w-8 border border-white/10 transition-transform duration-300 group-hover:scale-110">
                {avatarUrl && <AvatarImage src={avatarUrl} referrerPolicy="no-referrer" />}
                <AvatarFallback className="bg-white/5 text-white/30 text-[10px] font-bold">{authorInitials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white/50 group-hover:text-white/80 transition-colors">{article.author_name}</span>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
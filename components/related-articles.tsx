'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from '@/lib/date-utils'
import Link from 'next/link'
import Image from 'next/image'
import { generateArticleSlug } from '@/lib/url-utils'

interface RelatedArticlesProps {
  currentArticleId: string
  category?: string
  language: string
  className?: string
}

interface Article {
  id: string
  title: string
  title_english?: string
  summary: string
  summary_english?: string
  author_name: string
  author_avatar?: string
  article_published_at: string
  category?: string
  image?: string
}

export function RelatedArticles({ currentArticleId, category, language, className }: RelatedArticlesProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRelatedArticles() {
      const supabase = createClient()
      
      try {
        const query = supabase
          .from('articles')
          .select(`
            id,
            title,
            title_english,
            summary,
            summary_english,
            author_name,
            author_avatar,
            article_published_at,
            category,
            image
          `)
          .neq('id', currentArticleId)
          .not('title', 'is', null)
          .order('article_published_at', { ascending: false })
          .limit(6)

        // If we have a category, prioritize articles from the same category
        if (category) {
          const { data: categoryArticles } = await query
            .ilike('category', `%${category}%`)
            .limit(3)
          
          // Get additional articles from other categories
          const { data: otherArticles } = await supabase
            .from('articles')
            .select(`
              id,
              title,
              title_english,
              summary,
              summary_english,
              author_name,
              author_avatar,
              article_published_at,
              category,
              image
            `)
            .neq('id', currentArticleId)
            .not('category', 'ilike', `%${category}%`)
            .not('title', 'is', null)
            .order('article_published_at', { ascending: false })
            .limit(3)

          const combined = [...(categoryArticles || []), ...(otherArticles || [])]
          setArticles(combined.slice(0, 6))
        } else {
          const { data } = await query
          setArticles(data || [])
        }
      } catch (error) {
        console.error('Error fetching related articles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedArticles()
  }, [currentArticleId, category])

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-muted rounded-full" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (articles.length === 0) {
    return null
  }

  return (
    <div className={className || "mt-12"}>
      <h2 className="text-2xl font-bold mb-6">
        {language === 'zh' ? '相关文章' : 'Related Articles'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => {
          const publishedDate = new Date(article.article_published_at)
          const year = publishedDate.getUTCFullYear().toString()
          const month = String(publishedDate.getUTCMonth() + 1).padStart(2, '0')
          const day = String(publishedDate.getUTCDate()).padStart(2, '0')
          const slug = generateArticleSlug(article.title, article.id)
          const articleUrl = `/${language}/article/${year}/${month}/${day}/${slug}`
          
          const title = language === 'zh' ? article.title : (article.title_english || article.title)
          const summary = language === 'zh' ? article.summary : (article.summary_english || article.summary)
          
          const authorInitials = article.author_name
            ?.split(' ')
            .map((name: string) => name.charAt(0))
            .join('')
            .toUpperCase() || '??'

          return (
            <Link key={article.id} href={articleUrl}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                {article.image && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <Image
                      src={article.image}
                      alt={`Cover image for article: ${title}`}
                      width={400}
                      height={192}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                      referrerPolicy="no-referrer"
                      unoptimized
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  {summary && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {summary}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={article.author_avatar} alt={article.author_name} />
                      <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
                    </Avatar>
                    <span>{article.author_name}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(article.article_published_at))}</span>
                  </div>
                  {article.category && (
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground border border-border px-2 py-1 text-xs">
                        {article.category.split(',')[0].trim()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
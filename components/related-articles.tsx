'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Article } from '@/components/article-card'
import { categoryIdToSlug } from '@/lib/url-utils'

interface RelatedArticlesProps {
  articles: Article[]
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null

  return (
    <div className="space-y-6">
      <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">
        Related Articles
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articles.map((article) => {
          const displayTitle = article.title_english || article.title
          const categorySlug = article.category ? categoryIdToSlug(article.category) : 'tech'

          return (
            <Link
              key={article.id}
              href={`/article/${categorySlug}/${article.slug}`}
              className="group flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
            >
              {/* Thumbnail */}
              {article.image && (
                <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-white/5">
                  <Image
                    src={article.image}
                    alt={displayTitle}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors line-clamp-2 mb-1">
                  {displayTitle}
                </h4>
                <div className="text-[10px] text-white/30">
                  <span>@{article.author_handle}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

import { Suspense } from 'react'
import Link from 'next/link'
import { createAnonClient } from '@/lib/supabase/server'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Article Archive | Xarticle',
  description: 'Browse the archive of articles with score below 65. Articles link directly to X (Twitter) for full content.',
  openGraph: {
    title: 'Article Archive | Xarticle',
    description: 'Archive of articles with score below 65 from X.',
    url: 'https://www.xarticle.news/archive',
    siteName: 'Xarticle',
    type: 'website',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Xarticle — Article Archive',
        type: 'image/webp'
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Article Archive | Xarticle',
    description: 'Archive of articles with score below 65 from leading voices on X.',
    images: ['/og-image.webp'],
  },
  alternates: {
    canonical: 'https://www.xarticle.news/archive',
  },
  robots: { index: true, follow: true },
}

export const revalidate = 300

const PAGE_SIZE = 50

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>
}

interface ArchiveArticle {
  id: string
  title: string
  author_name: string
  author_handle: string
  article_url: string
  tweet_views: number
  score: number
}

async function getArchivedArticles(search: string | undefined, page: number): Promise<{
  articles: ArchiveArticle[]
  total: number
  totalPages: number
}> {
  const supabase = createAnonClient()
  const offset = (page - 1) * PAGE_SIZE

  // Get count first
  let countQuery = supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })

  if (search && search.trim()) {
    countQuery = countQuery.or(`title.ilike.%${search.trim()}%,author_name.ilike.%${search.trim()}%`)
  }

  const { count: totalCount } = await countQuery

  // Get articles
  let query = supabase
    .from('articles')
    .select('id, title, author_name, author_handle, article_url, tweet_views, score')
    .lt('score', 65)
    .order('score', { ascending: false, nullsFirst: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (search && search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,author_name.ilike.%${search.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching archived articles:', error)
    return { articles: [], total: 0, totalPages: 0 }
  }

  const total = totalCount || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return {
    articles: (data || []) as ArchiveArticle[],
    total,
    totalPages
  }
}

function ArticleList({ articles, currentPage, totalPages, search }: {
  articles: ArchiveArticle[]
  currentPage: number
  totalPages: number
  search: string
}) {
  return (
    <div className="space-y-6">
      {/* Articles */}
      <div className="space-y-2">
        {articles.map((article, index) => (
          <a
            key={article.id}
            href={article.article_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-3 px-4 bg-white/5 hover:bg-white/10 transition-colors rounded-lg group"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="text-white/30 text-sm w-8 flex-shrink-0">
                {(currentPage - 1) * PAGE_SIZE + index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-white/90 group-hover:text-white transition-colors truncate">
                  {article.title}
                </h3>
                <p className="text-white/40 text-sm">
                  @{article.author_handle} · {article.author_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40 flex-shrink-0">
              <span>Score: {article.score}</span>
              <span>{article.tweet_views?.toLocaleString() || 0} views</span>
              <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </a>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {currentPage > 1 && (
            <Link
              href={`/archive?search=${encodeURIComponent(search)}&page=${currentPage - 1}`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Previous
            </Link>
          )}

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Link
                  key={pageNum}
                  href={`/archive?search=${encodeURIComponent(search)}&page=${pageNum}`}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pageNum === currentPage
                      ? 'bg-white text-black'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {pageNum}
                </Link>
              )
            })}
          </div>

          {currentPage < totalPages && (
            <Link
              href={`/archive?search=${encodeURIComponent(search)}&page=${currentPage + 1}`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default async function ArchivePage({ searchParams }: PageProps) {
  const { search, page } = await searchParams
  const currentPage = Math.max(1, parseInt(page || '1'))
  const { articles, total, totalPages } = await getArchivedArticles(search, currentPage)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "X Article Archive",
            "description": "Archive of articles with score below 65 from leading voices on X",
            "url": "https://xarticle.news/archive"
          })
        }}
      />
      <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/20">
        {/* Decorative background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] left-[10%] w-[30%] h-[30%] bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
          <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
        </div>

        <main className="relative z-10 mx-auto max-w-5xl px-6 pt-32 pb-20">
          <header className="mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
                  Archive <span className="text-white/40">vault.</span>
                </h1>
                <p className="text-white/40 text-lg font-light max-w-lg">
                  Articles with score below 65. Sorted by score. Click to read on X.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-bold">{total}</div>
                  <div className="text-white/40 text-sm">Articles</div>
                </div>
                <Link
                  href="/"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>

            {/* Search */}
            <form className="mt-8" action="/archive" method="get">
              <input
                type="text"
                name="search"
                defaultValue={search || ''}
                placeholder="Search by title or author..."
                className="w-full max-w-md px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 transition-colors"
              />
            </form>
          </header>

          <section aria-labelledby="archive">
            <h2 id="archive" className="sr-only">Article Archive</h2>
            <Suspense fallback={<div className="text-white/40">Loading...</div>}>
              <ArticleList
                articles={articles}
                currentPage={currentPage}
                totalPages={totalPages}
                search={search || ''}
              />
            </Suspense>
          </section>
        </main>
      </div>
    </>
  )
}

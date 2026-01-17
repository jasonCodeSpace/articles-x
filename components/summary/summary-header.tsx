import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'

interface SummaryHeaderProps {
  date: string
  createdAt: string
  language: 'en' | 'zh'
  onToggleLanguage: () => void
}

export function SummaryHeader({ date, createdAt, language, onToggleLanguage }: SummaryHeaderProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: enUS
  })

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Daily Summary</h1>
        <p className="text-muted-foreground mb-4">{formatDate(date)}</p>
      </div>

      {/* Author, Time Info and Language Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex shrink-0 overflow-hidden rounded-full h-6 w-6 ring-1 ring-border">
            <Image
              className="aspect-square h-full w-full"
              alt="xarticle profile picture"
              width={24}
              height={24}
              src="/logo.svg"
            />
          </span>
          <Link
            href="/summaries"
            className="font-medium text-muted-foreground truncate hover:text-foreground transition-colors"
          >
            @xarticle
          </Link>
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-4">
            <span>·</span>
            <time>{timeAgo}</time>
          </div>
        </div>

        {/* Single toggle button: EN <-> 中文 */}
        <button
          onClick={onToggleLanguage}
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:bg-accent transition-colors cursor-pointer select-none"
          aria-label={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
          title={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
          data-testid="summary-language-toggle"
        >
          {language === 'en' ? (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 8l6 6"/>
                <path d="M4 14l6-6 2-3"/>
                <path d="M2 5h12"/>
                <path d="M7 2h1"/>
                <path d="M22 22l-5-10-5 10"/>
                <path d="M14 18h6"/>
              </svg>
              English
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              中文
            </>
          )}
        </button>
      </div>
    </>
  )
}

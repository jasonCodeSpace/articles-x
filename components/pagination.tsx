'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  const [inputPage, setInputPage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset input when currentPage changes externally
  useEffect(() => {
    setInputPage('')
  }, [currentPage])

  if (totalPages <= 1) return null

  const handlePageJump = () => {
    const page = parseInt(inputPage)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page)
      setInputPage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageJump()
    }
  }

  const getVisiblePages = () => {
    // Use smaller delta for mobile to show fewer pages
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const delta = isMobile ? 1 : 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const visiblePages = getVisiblePages()

  return (
    <div className={`flex flex-col items-center gap-4 py-8 px-2 sm:px-0 ${className}`}>
      {/* Page numbers row */}
      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 rounded-full"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>

        {/* Page numbers */}
        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} className="px-1 sm:px-2 text-muted-foreground text-sm">
                ...
              </span>
            )
          }

          const pageNumber = page as number
          return (
            <Button
              key={pageNumber}
              variant={currentPage === pageNumber ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className={`
                min-w-[32px] sm:min-w-[40px] h-8 sm:h-9 text-xs sm:text-sm rounded-full
                ${currentPage === pageNumber
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                }
              `}
            >
              {pageNumber}
            </Button>
          )
        })}

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 rounded-full"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>

      {/* Page jump input */}
      <div className="flex items-center gap-2 text-sm text-white/50">
        <span>Page</span>
        <input
          ref={inputRef}
          type="number"
          min={1}
          max={totalPages}
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentPage.toString()}
          className="w-16 h-8 px-2 text-center bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
        />
        <span>of {totalPages}</span>
        <Button
          size="sm"
          onClick={handlePageJump}
          disabled={!inputPage || isNaN(parseInt(inputPage)) || parseInt(inputPage) < 1 || parseInt(inputPage) > totalPages}
          className="ml-2 h-8 px-3 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg transition-colors disabled:opacity-30 text-xs"
        >
          Go
        </Button>
      </div>
    </div>
  )
}

// Helper function to calculate pagination info
export function calculatePagination(totalItems: number, itemsPerPage: number, currentPage: number) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  
  return {
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  }
}
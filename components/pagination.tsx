'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null

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
    <div className={`flex items-center justify-center space-x-1 sm:space-x-2 py-8 px-2 sm:px-0 ${className}`}>
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 rounded-full"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>

      {/* Page numbers */}
      {visiblePages.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`dots-${index}`} className="px-1 sm:px-2 text-gray-500 text-sm">
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
                : 'border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white'
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
        className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 rounded-full"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
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
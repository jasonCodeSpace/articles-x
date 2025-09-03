'use client'

import { ExternalLink } from 'lucide-react'

interface XLinkProps {
  url: string
  authorHandle: string
}

export function XLink({ url, authorHandle }: XLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
      onClick={handleClick}
    >
      @{authorHandle || 'user'}
      <ExternalLink size={10} />
    </a>
  )
}
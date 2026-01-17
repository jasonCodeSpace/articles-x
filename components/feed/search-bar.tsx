import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState, useCallback } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  isLoading?: boolean
  onSubmit?: (value: string) => void
}

export function SearchBar({ value, onChange, isLoading = false, onSubmit }: SearchBarProps) {
  const [searchInput, setSearchInput] = useState(value)

  const handleChange = useCallback((newValue: string) => {
    setSearchInput(newValue)
    onChange(newValue)
  }, [onChange])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(searchInput)
  }, [searchInput, onSubmit])

  return (
    <form onSubmit={handleSubmit} className="flex-1 min-w-0">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/50 transition-colors" />
        <Input
          type="text"
          placeholder="Search articles..."
          value={searchInput}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-12 pr-4 bg-white/[0.03] border-white/5 text-white placeholder:text-white/20 focus:border-white/20 focus:ring-0 transition-all rounded-xl h-10"
          disabled={isLoading}
        />
      </div>
    </form>
  )
}

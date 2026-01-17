import { X } from 'lucide-react'
import { TIME_PERIODS } from './constants'

interface ActiveFiltersProps {
  selectedTimePeriod: string
  onClearTimePeriod: () => void
}

export function ActiveFilters({
  selectedTimePeriod,
  onClearTimePeriod
}: ActiveFiltersProps) {
  const hasActiveFilters = selectedTimePeriod !== 'all'

  if (!hasActiveFilters) {
    return null
  }

  const currentTimePeriod = TIME_PERIODS.find(p => p.value === selectedTimePeriod)

  return (
    <div className="flex items-center gap-2">
      {selectedTimePeriod !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/50">
          {currentTimePeriod?.label}
          <X
            className="h-2.5 w-2.5 cursor-pointer hover:text-white"
            onClick={onClearTimePeriod}
          />
        </span>
      )}
    </div>
  )
}

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, X } from 'lucide-react'
import { ReactNode } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  icon: ReactNode
  label: string
  selectedValue: string
  options: FilterOption[]
  onSelect: (value: string) => void
  onClear?: () => void
  align?: 'start' | 'end' | 'center'
  width?: string
}

export function FilterDropdown({
  icon,
  label,
  selectedValue,
  options,
  onSelect,
  onClear,
  align = 'end',
  width = 'w-44'
}: FilterDropdownProps) {
  const selectedOption = options.find(o => o.value === selectedValue)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 sm:gap-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all px-3 sm:px-4 h-10 min-w-0"
        >
          {icon}
          <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold hidden xs:inline">
            {selectedOption?.label || label}
          </span>
          {onClear && selectedValue !== 'all' ? (
            <X
              className="h-3 w-3 opacity-50 hover:opacity-100 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
            />
          ) : (
            <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={`${width} max-h-80 overflow-y-auto !bg-[#0A0A0A] border border-white/10 rounded-2xl p-2`}
      >
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-white/30 px-2 py-1">
          {label}
        </DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`rounded-lg text-[11px] uppercase tracking-wider cursor-pointer transition-colors ${
              selectedValue === option.value
                ? 'text-white bg-white/10'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

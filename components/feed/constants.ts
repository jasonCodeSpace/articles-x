export const TIME_PERIODS = [
  { value: 'all', label: 'All Time', shortLabel: 'All' },
  { value: 'today', label: 'Today', shortLabel: 'Today' },
  { value: 'week', label: 'This Week', shortLabel: 'Week' },
  { value: 'month', label: 'This Month', shortLabel: 'Month' },
  { value: '3months', label: 'Last 3 Months', shortLabel: '3M' },
] as const

export const LANGUAGES = [
  { value: 'en', label: 'English', shortLabel: 'EN' },
  { value: 'cn', label: '中文', shortLabel: 'CN' },
] as const

export type TimePeriod = typeof TIME_PERIODS[number]['value']
export type DisplayLanguage = typeof LANGUAGES[number]['value']

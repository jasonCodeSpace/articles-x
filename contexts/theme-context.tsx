'use client'

import { ReactNode } from 'react'

interface ThemeProviderProps {
  children: ReactNode
}

// App is always in dark mode - no need for next-themes overhead
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>
}

export const useTheme = () => ({ theme: 'dark', setTheme: () => {} })
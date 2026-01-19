'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-white/50">Please refresh the page to continue.</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-white text-black hover:bg-white/90"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

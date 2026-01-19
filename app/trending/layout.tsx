import { ClientNavWrapper } from '@/components/client-nav-wrapper'

interface TrendingLayoutProps {
  children: React.ReactNode
}

// Trending is a public page - no auth check needed for faster loading
export default async function TrendingLayout({
  children,
}: TrendingLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <ClientNavWrapper />

      {/* Main Content */}
      <div className="pt-20 md:pt-16 pb-20 md:pb-0">
        {children}
      </div>
    </div>
  )
}
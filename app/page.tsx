import { redirect } from 'next/navigation'

// Enable static generation for root page
export const dynamic = 'force-static'
export const revalidate = 60

export default function RootPage() {
  // Redirect to new page for better SEO
  redirect('/new')
}
import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect to new page for better SEO
  redirect('/new')
}
import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect to articles page for better SEO
  redirect('/articles')
}
import { permanentRedirect } from 'next/navigation'

// Permanently redirect /landing to / for SEO
// HTTP 308 tells search engines that this page has permanently moved
export default function LandingPage() {
  permanentRedirect('/')
}

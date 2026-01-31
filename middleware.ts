import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAnonClient } from '@/lib/supabase/server'

/**
 * Get article category for redirect purposes
 * Returns the primary category slug for an article
 */
async function getArticleCategorySlug(slug: string): Promise<string | null> {
  try {
    const supabase = createAnonClient()

    // First try to get from junction table
    const { data: article, error } = await supabase
      .from('articles')
      .select('id, category')
      .eq('slug', slug)
      .maybeSingle()

    if (error || !article) {
      return null
    }

    // Try to get primary category from junction table
    const { data: primaryCategory } = await supabase
      .from('article_categories')
      .select('category')
      .eq('article_id', article.id)
      .eq('is_primary', true)
      .maybeSingle()

    if (primaryCategory?.category) {
      return primaryCategory.category.replace(':', '-')
    }

    // Fallback to article.category
    if (article.category) {
      return article.category.replace(':', '-')
    }

    return null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  // Domain canonicalization: redirect non-www to www and http to https
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''

  // Skip HTTPS redirect for localhost development
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  if (!isLocal) {
    // Redirect http to https for production
    if (request.headers.get('x-forwarded-proto') !== 'https') {
      url.protocol = 'https:'
      url.host = hostname || 'www.xarticle.news'
      return NextResponse.redirect(url, 301)
    }
  }

  // Redirect non-www to www
  if (hostname && hostname.startsWith('xarticle.news')) {
    url.host = 'www.xarticle.news'
    return NextResponse.redirect(url, 301)
  }

  // Redirect www without http/https to proper https www
  if (hostname === 'xarticle.news' || hostname === 'www.xarticle.news') {
    url.host = 'www.xarticle.news'
  }

  const pathname = request.nextUrl.pathname

  // Handle old article URL format redirect FIRST!
  // Must be before the fast path check to ensure it's executed
  if (pathname.match(/^\/article\/[^\/]+$/)) {
    const slug = pathname.split('/article/')[1]

    // Skip if this is already the new format (contains hyphen converted from colon)
    // We'll check if the article exists and get its category
    const categorySlug = await getArticleCategorySlug(slug)

    if (categorySlug) {
      const newUrl = new URL(`/article/${categorySlug}/${slug}`, request.url)
      return NextResponse.redirect(newUrl, 301)
    }
  }

  // URL normalization: redirect uppercase category URLs to lowercase
  if (pathname.startsWith('/category/')) {
    const categoryPart = pathname.split('/category/')[1]
    if (categoryPart && categoryPart !== categoryPart.toLowerCase()) {
      const url = request.nextUrl.clone()
      url.pathname = `/category/${categoryPart.toLowerCase()}`
      return NextResponse.redirect(url, 301)
    }
  }

  // Define route types - skip auth for public routes
  const isAuthRoute = pathname.startsWith('/login') ||
                       pathname.startsWith('/auth') ||
                       pathname.startsWith('/register') ||
                       pathname.startsWith('/verify') ||
                       pathname.startsWith('/reset-password')

  const isPublicFile = pathname.startsWith('/_next') ||
                       pathname.startsWith('/favicon.ico') ||
                       pathname.startsWith('/api') ||
                       pathname === '/robots.txt' ||
                       pathname === '/sitemap.xml' ||
                       pathname === '/sitemap-ping.xml' ||
                       (pathname.startsWith('/sitemap') && pathname.endsWith('.xml')) ||
                       pathname.endsWith('.html') ||
                       pathname === '/rss.xml' ||
                       pathname.endsWith('.txt') ||
                       (pathname.startsWith('/yandex_') && pathname.endsWith('.html'))

  // Fully public routes - no auth check needed, no blocking
  const isFullyPublicRoute = pathname === '/' ||
                        pathname === '/landing' ||
                        pathname === '/trending' ||
                        pathname.startsWith('/trending') ||
                        pathname === '/archive' ||
                        pathname.startsWith('/archive') ||
                        pathname.startsWith('/category/') ||
                        pathname.startsWith('/author/') ||
                        pathname.startsWith('/article/') ||
                        pathname === '/summary' ||
                        pathname.startsWith('/summary/') ||
                        pathname === '/summaries' ||
                        pathname.startsWith('/summaries/') ||
                        pathname === '/terms' ||
                        pathname === '/privacy' ||
                        pathname === '/about' ||
                        pathname === '/contact'

  const isProtectedRoute = pathname.startsWith('/profile')
  const isRestrictedRoute = pathname === '/history' || pathname.startsWith('/history')

  // FAST PATH: Public routes/files skip auth entirely
  if (isFullyPublicRoute || isPublicFile) {
    return NextResponse.next({ request })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  // If env is missing, redirect protected routes to login
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedRoute || isRestrictedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  // Only create Supabase client for auth/restricted/protected routes
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Only check auth for protected/restricted routes
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect logic for restricted routes
  if (!user && isRestrictedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/register'
    return NextResponse.redirect(url)
  }

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/trending'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
  ],
}
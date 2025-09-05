import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname
  
  // URL normalization: redirect uppercase category URLs to lowercase
  if (pathname.startsWith('/category/')) {
    const categoryPart = pathname.split('/category/')[1]
    if (categoryPart && categoryPart !== categoryPart.toLowerCase()) {
      const url = request.nextUrl.clone()
      url.pathname = `/category/${categoryPart.toLowerCase()}`
      return NextResponse.redirect(url, 301)
    }
  }
  const isAuthRoute = pathname.startsWith('/login') || 
                       pathname.startsWith('/auth') || 
                       pathname.startsWith('/register') || 
                       pathname.startsWith('/verify') ||
                       pathname.startsWith('/reset-password') ||
                       pathname.startsWith('/debug-auth') ||
                       pathname.startsWith('/test-auth') ||
                       pathname.startsWith('/test-articles')
  const isPublicFile = pathname.startsWith('/_next') ||
                       pathname.startsWith('/favicon.ico') ||
                       pathname.startsWith('/api') ||
                       pathname === '/robots.txt' ||
                       pathname === '/sitemap.xml' ||
                       pathname === '/sitemap-ping.xml' ||
                       pathname.startsWith('/sitemap') && pathname.endsWith('.xml')
  
  // Check if it's a shared article link (has referrer from external source)
  const referrer = request.headers.get('referer')
  const isSharedArticleLink = pathname.startsWith('/article/') && 
                              (!referrer || !referrer.includes(request.nextUrl.host))
  
  const isPublicRoute = pathname === '/' || 
                        pathname === '/landing' || 
                        pathname === '/trending' ||
                        pathname.startsWith('/trending') ||
                        pathname.startsWith('/category/') ||
                        pathname === '/terms' ||
                        pathname === '/privacy' ||
                        pathname === '/summary' ||
                        pathname === '/summaries' ||
                        isSharedArticleLink
  const isProtectedRoute = pathname.startsWith('/profile')
  
  // Routes that require authentication (redirect to register page)
  const isRestrictedRoute = pathname === '/history' ||
                           pathname.startsWith('/history') ||
                           pathname.startsWith('/author/') ||
                           (pathname.startsWith('/article/') && !isSharedArticleLink)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  // If env is missing, avoid throwing and redirect protected routes to login
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isAuthRoute && !isPublicFile && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not logged in and trying to access restricted routes, redirect to register
  if (!user && isRestrictedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/register'
    return NextResponse.redirect(url)
  }

  // If user is not logged in and trying to access protected routes
  if (!user && !isAuthRoute && !isPublicFile && !isPublicRoute && !isRestrictedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is not logged in and trying to access profile page
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and trying to access auth pages, redirect to trending
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
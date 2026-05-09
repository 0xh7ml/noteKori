import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes — no auth required
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password']

function getToken(request: NextRequest): string | null {
  // Check cookie for auth token (set during sign-in/sign-up)
  const token = request.cookies.get('notekori_token')?.value
  return token || null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const token = getToken(request)
  const isAuthenticated = !!token

  // Root path - redirect based on auth status
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Public paths - redirect to dashboard if already authenticated
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Protected paths - redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

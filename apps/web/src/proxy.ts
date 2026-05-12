import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { COOKIE_CHAMUCO_AUTH_NAME, COOKIE_CHAMUCO_REGISTERED_NAME } from '@/lib/auth-cookies';

/**
 * Route-level auth guards with three-state logic.
 *
 * Two cookies drive routing decisions:
 *   chamuco-auth        (dev) / __Host-chamuco-auth        (prod)
 *   chamuco-registered  (dev) / __Host-chamuco-registered  (prod)
 *
 * Set by AuthProvider when Firebase reports a signed-in user. Neither cookie
 * is cryptographically verified here — they are used for routing only. Real
 * auth verification always happens server-side via Firebase Admin SDK.
 *
 * Three states:
 *   unauthenticated     — no auth cookie                  → redirect to /sign-in
 *   auth + unregistered — auth cookie, no registered cookie → redirect to /onboarding
 *   auth + registered   — both cookies present            → allow through
 *
 * Route overrides:
 *   /sign-in    — unauthenticated → next(); auth+unregistered → /onboarding; auth+registered → /
 *   /onboarding — unauthenticated → /sign-in; auth+unregistered → next(); auth+registered → /
 *   all others  — unauthenticated → /sign-in; auth+unregistered → /onboarding; auth+registered → next()
 */
export default function proxy(request: NextRequest): NextResponse {
  const isAuthenticated = request.cookies.has(COOKIE_CHAMUCO_AUTH_NAME);
  const isRegistered = request.cookies.has(COOKIE_CHAMUCO_REGISTERED_NAME);
  const { pathname } = request.nextUrl;

  if (pathname === '/sign-in') {
    if (!isAuthenticated) return NextResponse.next();
    if (!isRegistered) return NextResponse.redirect(new URL('/onboarding', request.url));
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Public legal pages — always accessible regardless of auth state
  if (
    pathname === '/privacy-policy' ||
    pathname === '/terms-of-service' ||
    pathname === '/account-deletion'
  ) {
    return NextResponse.next();
  }

  if (pathname === '/onboarding') {
    if (!isAuthenticated) return NextResponse.redirect(new URL('/sign-in', request.url));
    if (isRegistered) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  // All other app routes: require full auth + registration
  if (!isAuthenticated) return NextResponse.redirect(new URL('/sign-in', request.url));
  if (!isRegistered) return NextResponse.redirect(new URL('/onboarding', request.url));
  return NextResponse.next();
}

// api/ is excluded from the matcher so cookie-redirect logic never intercepts
// Next.js Route Handlers. Without this, /api/cities would receive a 307 redirect
// instead of JSON when called from the onboarding page (chamuco-auth present,
// chamuco-registered absent). Route Handlers must implement their own auth if needed.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|api/|.*\\..*).*)'],
};

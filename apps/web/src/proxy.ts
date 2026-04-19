import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route-level auth guards with three-state logic.
 *
 * Two cookies drive routing decisions:
 *   chamuco-auth        — set by AuthProvider when Firebase reports a signed-in user
 *   chamuco-registered  — set by sign-in and onboarding pages when Chamuco registration
 *                         is confirmed (GET /users/me → 200 or POST /auth/register → 201)
 *
 * Neither cookie is cryptographically verified here — they are used for routing only.
 * Real auth verification always happens server-side via Firebase Admin SDK.
 *
 * Three states:
 *   unauthenticated     — no chamuco-auth            → redirect to /sign-in
 *   auth + unregistered — chamuco-auth, no chamuco-registered → redirect to /onboarding
 *   auth + registered   — both cookies present       → allow through
 *
 * Route overrides:
 *   /sign-in    — unauthenticated → next(); auth+unregistered → /onboarding; auth+registered → /
 *   /onboarding — unauthenticated → /sign-in; auth+unregistered → next(); auth+registered → /
 *   all others  — unauthenticated → /sign-in; auth+unregistered → /onboarding; auth+registered → next()
 */
export function proxy(request: NextRequest): NextResponse {
  const isAuthenticated = request.cookies.has('chamuco-auth');
  const isRegistered = request.cookies.has('chamuco-registered');
  const { pathname } = request.nextUrl;

  if (pathname === '/sign-in') {
    if (!isAuthenticated) return NextResponse.next();
    if (!isRegistered) return NextResponse.redirect(new URL('/onboarding', request.url));
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Public legal pages — always accessible regardless of auth state
  if (pathname === '/privacy-policy' || pathname === '/terms-of-service') {
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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|api/|.*\\..*).*)'],
};

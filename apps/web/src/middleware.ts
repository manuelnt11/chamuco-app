import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route-level auth guards for unauthenticated and already-authenticated users.
 *
 * Auth detection relies on the `chamuco-auth` session cookie set by AuthProvider
 * when Firebase reports a signed-in user. The cookie is not verified cryptographically
 * here — it is only used for routing. The NestJS API always performs real token
 * verification via Firebase Admin SDK on every protected request.
 *
 * /sign-in    — authenticated users are redirected to /
 * /onboarding — unauthenticated users are redirected to /sign-in
 */
export function middleware(request: NextRequest): NextResponse {
  const isAuthenticated = request.cookies.has('chamuco-auth');
  const { pathname } = request.nextUrl;

  if (pathname === '/sign-in' && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname === '/onboarding' && !isAuthenticated) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/sign-in', '/onboarding'],
};

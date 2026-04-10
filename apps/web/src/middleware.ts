import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Redirects authenticated users away from /sign-in.
 *
 * Auth detection relies on the `chamuco-auth` session cookie set by AuthProvider
 * when Firebase reports a signed-in user. The cookie is not verified cryptographically
 * here — it is only used for routing. The NestJS API always performs real token
 * verification via Firebase Admin SDK on every protected request.
 */
export function middleware(request: NextRequest): NextResponse {
  const isAuthenticated = request.cookies.has('chamuco-auth');

  if (isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/sign-in'],
};

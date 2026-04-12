import { middleware } from './middleware';

// vi.hoisted ensures mock functions exist before the vi.mock factory runs
const { mockNext, mockRedirect } = vi.hoisted(() => ({
  mockNext: vi.fn(),
  mockRedirect: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    next: mockNext,
    redirect: mockRedirect,
  },
}));

/** Build a minimal mock NextRequest with optional cookies */
function makeRequest(
  url: string,
  cookies: Record<string, string> = {},
): Parameters<typeof middleware>[0] {
  const cookieStore = {
    has: (name: string) => Object.prototype.hasOwnProperty.call(cookies, name),
    get: (name: string) =>
      cookies[name] !== undefined ? { name, value: cookies[name] } : undefined,
  };

  return {
    url,
    nextUrl: new URL(url),
    cookies: cookieStore,
  } as Parameters<typeof middleware>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNext.mockReturnValue({ type: 'next' });
  mockRedirect.mockReturnValue({ type: 'redirect' });
});

describe('middleware', () => {
  describe('/sign-in — unauthenticated (no chamuco-auth cookie)', () => {
    it('calls NextResponse.next() when no cookies are present', () => {
      const request = makeRequest('https://app.chamucotravel.com/sign-in');
      middleware(request);
      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('returns the result of NextResponse.next()', () => {
      const request = makeRequest('https://app.chamucotravel.com/sign-in');
      const result = middleware(request);
      expect(result).toEqual({ type: 'next' });
    });
  });

  describe('/sign-in — auth but not registered (chamuco-auth only)', () => {
    it('redirects to /onboarding', () => {
      const request = makeRequest('https://app.chamucotravel.com/sign-in', {
        'chamuco-auth': '1',
      });
      middleware(request);
      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/onboarding', 'https://app.chamucotravel.com/sign-in'),
      );
    });

    it('does not call NextResponse.next()', () => {
      const request = makeRequest('https://app.chamucotravel.com/sign-in', {
        'chamuco-auth': '1',
      });
      middleware(request);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('/sign-in — fully authenticated (both cookies present)', () => {
    it('redirects to /', () => {
      const request = makeRequest('https://app.chamucotravel.com/sign-in', {
        'chamuco-auth': '1',
        'chamuco-registered': '1',
      });
      middleware(request);
      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/', 'https://app.chamucotravel.com/sign-in'),
      );
    });

    it('does not call NextResponse.next() when fully authenticated', () => {
      const request = makeRequest('https://app.chamucotravel.com/sign-in', {
        'chamuco-auth': '1',
        'chamuco-registered': '1',
      });
      middleware(request);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns the result of NextResponse.redirect()', () => {
      const request = makeRequest('https://app.chamucotravel.com/sign-in', {
        'chamuco-auth': '1',
        'chamuco-registered': '1',
      });
      const result = middleware(request);
      expect(result).toEqual({ type: 'redirect' });
    });
  });

  describe('/onboarding — unauthenticated (no chamuco-auth cookie)', () => {
    it('redirects to /sign-in', () => {
      const request = makeRequest('https://app.chamucotravel.com/onboarding');
      middleware(request);
      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/sign-in', 'https://app.chamucotravel.com/onboarding'),
      );
    });

    it('returns the result of NextResponse.redirect()', () => {
      const request = makeRequest('https://app.chamucotravel.com/onboarding');
      const result = middleware(request);
      expect(result).toEqual({ type: 'redirect' });
    });
  });

  describe('/onboarding — auth but not registered (chamuco-auth only)', () => {
    it('calls NextResponse.next()', () => {
      const request = makeRequest('https://app.chamucotravel.com/onboarding', {
        'chamuco-auth': '1',
      });
      middleware(request);
      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('returns the result of NextResponse.next()', () => {
      const request = makeRequest('https://app.chamucotravel.com/onboarding', {
        'chamuco-auth': '1',
      });
      const result = middleware(request);
      expect(result).toEqual({ type: 'next' });
    });
  });

  describe('/onboarding — fully authenticated (both cookies present)', () => {
    it('redirects to /', () => {
      const request = makeRequest('https://app.chamucotravel.com/onboarding', {
        'chamuco-auth': '1',
        'chamuco-registered': '1',
      });
      middleware(request);
      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/', 'https://app.chamucotravel.com/onboarding'),
      );
    });
  });

  describe('protected routes (e.g. /, /trips, /profile/settings)', () => {
    it('redirects unauthenticated request to /sign-in', () => {
      const request = makeRequest('https://app.chamucotravel.com/');
      middleware(request);
      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/sign-in', 'https://app.chamucotravel.com/'),
      );
    });

    it('redirects auth-but-unregistered request to /onboarding', () => {
      const request = makeRequest('https://app.chamucotravel.com/', {
        'chamuco-auth': '1',
      });
      middleware(request);
      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/onboarding', 'https://app.chamucotravel.com/'),
      );
    });

    it('calls NextResponse.next() when both cookies are present', () => {
      const request = makeRequest('https://app.chamucotravel.com/', {
        'chamuco-auth': '1',
        'chamuco-registered': '1',
      });
      middleware(request);
      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('redirects unauthenticated /trips request to /sign-in', () => {
      const request = makeRequest('https://app.chamucotravel.com/trips');
      middleware(request);
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/sign-in', 'https://app.chamucotravel.com/trips'),
      );
    });

    it('redirects auth-but-unregistered /trips request to /onboarding', () => {
      const request = makeRequest('https://app.chamucotravel.com/trips', {
        'chamuco-auth': '1',
      });
      middleware(request);
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/onboarding', 'https://app.chamucotravel.com/trips'),
      );
    });

    it('calls NextResponse.next() for /trips when fully authenticated', () => {
      const request = makeRequest('https://app.chamucotravel.com/trips', {
        'chamuco-auth': '1',
        'chamuco-registered': '1',
      });
      middleware(request);
      expect(mockNext).toHaveBeenCalledOnce();
    });
  });
});

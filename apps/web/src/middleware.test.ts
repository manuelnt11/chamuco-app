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
  describe('/sign-in — unauthenticated request (no chamuco-auth cookie)', () => {
    it('calls NextResponse.next() when cookie is absent', () => {
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

  describe('/sign-in — authenticated request (chamuco-auth cookie present)', () => {
    it('calls NextResponse.redirect() to the home URL', () => {
      const request = makeRequest('https://app.chamucotravel.com/sign-in', {
        'chamuco-auth': '1',
      });
      middleware(request);
      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/', 'https://app.chamucotravel.com/sign-in'),
      );
    });

    it('does not call NextResponse.next() when authenticated', () => {
      const request = makeRequest('https://app.chamucotravel.com/sign-in', {
        'chamuco-auth': '1',
      });
      middleware(request);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns the result of NextResponse.redirect()', () => {
      const request = makeRequest('https://app.chamucotravel.com/sign-in', {
        'chamuco-auth': '1',
      });
      const result = middleware(request);
      expect(result).toEqual({ type: 'redirect' });
    });
  });

  describe('/onboarding — unauthenticated request (no chamuco-auth cookie)', () => {
    it('calls NextResponse.redirect() to /sign-in', () => {
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

  describe('/onboarding — authenticated request (chamuco-auth cookie present)', () => {
    it('calls NextResponse.next() when cookie is present', () => {
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
});

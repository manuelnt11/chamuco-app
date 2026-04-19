import { NextRequest } from 'next/server';
import { GET } from './route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeRequest(url: string, cookies: Record<string, string> = {}): NextRequest {
  const req = new NextRequest(url);
  vi.spyOn(req.cookies, 'has').mockImplementation((name) =>
    Object.prototype.hasOwnProperty.call(cookies, name),
  );
  return req;
}

const AUTH_COOKIE = { '__Host-chamuco-auth': '1' };

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubEnv('GEONAMES_USERNAME', 'testuser');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/cities', () => {
  describe('auth gate', () => {
    it('returns 401 when __Host-chamuco-auth cookie is absent', async () => {
      const req = makeRequest('http://localhost/api/cities?q=Med&country=CO');
      const res = await GET(req);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ geonames: [] });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('proceeds when __Host-chamuco-auth cookie is present', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ geonames: [] }) });
      const req = makeRequest('http://localhost/api/cities?q=Med&country=CO', AUTH_COOKIE);
      const res = await GET(req);
      expect(res.status).toBe(200);
    });
  });

  describe('input validation', () => {
    it('returns empty when q is shorter than 2 chars', async () => {
      const req = makeRequest('http://localhost/api/cities?q=M&country=CO', AUTH_COOKIE);
      const res = await GET(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ geonames: [] });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns empty when country is absent', async () => {
      const req = makeRequest('http://localhost/api/cities?q=Med', AUTH_COOKIE);
      const res = await GET(req);
      expect(await res.json()).toEqual({ geonames: [] });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('GEONAMES_USERNAME env var', () => {
    it('returns empty when GEONAMES_USERNAME is not set', async () => {
      vi.stubEnv('GEONAMES_USERNAME', '');
      const req = makeRequest('http://localhost/api/cities?q=Med&country=CO', AUTH_COOKIE);
      const res = await GET(req);
      expect(await res.json()).toEqual({ geonames: [] });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('GeoNames API', () => {
    it('forwards results from GeoNames', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            geonames: [{ name: 'Medellín', adminName1: 'Antioquia' }],
          }),
      });
      const req = makeRequest('http://localhost/api/cities?q=Med&country=CO', AUTH_COOKIE);
      const res = await GET(req);
      expect(await res.json()).toEqual({
        geonames: [{ name: 'Medellín', adminName1: 'Antioquia' }],
      });
    });

    it('includes correct query params in the GeoNames request', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ geonames: [] }) });
      const req = makeRequest('http://localhost/api/cities?q=Med&country=CO', AUTH_COOKIE);
      await GET(req);
      const calledUrl = String(mockFetch.mock.calls[0]?.[0]);
      expect(calledUrl).toContain('q=Med');
      expect(calledUrl).toContain('country=CO');
      expect(calledUrl).toContain('username=testuser');
      expect(calledUrl).toContain('featureClass=P');
    });

    it('returns empty on non-ok GeoNames response', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const req = makeRequest('http://localhost/api/cities?q=Med&country=CO', AUTH_COOKIE);
      const res = await GET(req);
      expect(await res.json()).toEqual({ geonames: [] });
    });

    it('returns empty on network error', async () => {
      mockFetch.mockRejectedValue(new Error('network error'));
      const req = makeRequest('http://localhost/api/cities?q=Med&country=CO', AUTH_COOKIE);
      const res = await GET(req);
      expect(await res.json()).toEqual({ geonames: [] });
    });
  });
});

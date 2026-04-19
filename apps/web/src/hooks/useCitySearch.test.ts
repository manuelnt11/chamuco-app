import { act, renderHook } from '@testing-library/react';
import { useCitySearch } from './useCitySearch';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function geonamesResponse(names: string[]) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        geonames: names.map((name) => ({ name, adminName1: 'Antioquia' })),
      }),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  mockFetch.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useCitySearch', () => {
  it('returns empty results and no loading when query is shorter than 2 chars', () => {
    const { result } = renderHook(() => useCitySearch('CO', 'M'));
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns empty results and no loading when country is empty', () => {
    const { result } = renderHook(() => useCitySearch('', 'Medellín'));
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fires fetch after 300ms debounce and returns mapped results', async () => {
    mockFetch.mockResolvedValue(geonamesResponse(['Medellín', 'Manizales']));

    const { result } = renderHook(() => useCitySearch('CO', 'Me'));

    expect(mockFetch).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cities?'),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([
      { name: 'Medellín', region: 'Antioquia' },
      { name: 'Manizales', region: 'Antioquia' },
    ]);
  });

  it('does not fire fetch if query changes within the debounce window', async () => {
    mockFetch.mockResolvedValue(geonamesResponse(['Bogotá']));

    const { rerender } = renderHook(({ q }) => useCitySearch('CO', q), {
      initialProps: { q: 'Bo' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    rerender({ q: 'Bog' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(mockFetch).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('q=Bog'), expect.any(Object));
  });

  it('aborts in-flight request when query changes before response arrives', async () => {
    let aborted = false;
    mockFetch.mockImplementation((_url: string, opts: RequestInit) => {
      opts.signal?.addEventListener('abort', () => {
        aborted = true;
      });
      return new Promise(() => {}); // never resolves
    });

    const { rerender } = renderHook(({ q }) => useCitySearch('CO', q), {
      initialProps: { q: 'Me' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    rerender({ q: 'Med' });
    expect(aborted).toBe(true);
  });

  it('returns empty results on fetch network error', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useCitySearch('CO', 'Me'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it('does not update results when fetch is aborted (AbortError)', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    mockFetch.mockRejectedValue(abortError);

    const { result } = renderHook(() => useCitySearch('CO', 'Me'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it('returns empty results on non-ok HTTP response', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: vi.fn() });

    const { result } = renderHook(() => useCitySearch('CO', 'Me'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([]);
  });
});

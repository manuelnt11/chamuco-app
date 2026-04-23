import { act, renderHook } from '@testing-library/react';
import axios, { type AxiosRequestConfig } from 'axios';
import { useCitySearch } from './useCitySearch';

vi.mock('@/services/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

// Import after mock to get the mocked instance
import { apiClient } from '@/services/api-client';
const mockGet = vi.mocked(apiClient.get);

function apiResponse(cities: Array<{ name: string; region: string }>) {
  return Promise.resolve({ data: cities });
}

beforeEach(() => {
  vi.useFakeTimers();
  mockGet.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useCitySearch', () => {
  it('returns empty results and no loading when query is shorter than 2 chars', () => {
    const { result } = renderHook(() => useCitySearch('CO', 'M'));
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('returns empty results and no loading when country is empty', () => {
    const { result } = renderHook(() => useCitySearch('', 'Medellín'));
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fires request after 300ms debounce and returns results', async () => {
    mockGet.mockReturnValue(
      apiResponse([
        { name: 'Medellín', region: 'Antioquia' },
        { name: 'Manizales', region: 'Caldas' },
      ]),
    );

    const { result } = renderHook(() => useCitySearch('CO', 'Me'));

    expect(mockGet).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mockGet).toHaveBeenCalledWith(
      '/v1/locations/cities',
      expect.objectContaining({ params: { namePrefix: 'Me', country: 'CO' } }),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([
      { name: 'Medellín', region: 'Antioquia' },
      { name: 'Manizales', region: 'Caldas' },
    ]);
  });

  it('does not fire request if query changes within the debounce window', async () => {
    mockGet.mockReturnValue(apiResponse([{ name: 'Bogotá', region: 'Cundinamarca' }]));

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
    expect(mockGet).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith(
      '/v1/locations/cities',
      expect.objectContaining({ params: { namePrefix: 'Bog', country: 'CO' } }),
    );
  });

  it('aborts in-flight request when query changes before response arrives', async () => {
    let aborted = false;
    mockGet.mockImplementation((_url: string, config: AxiosRequestConfig | undefined) => {
      (config?.signal as AbortSignal | undefined)?.addEventListener('abort', () => {
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
    expect(mockGet).toHaveBeenCalledTimes(1);

    rerender({ q: 'Med' });
    expect(aborted).toBe(true);
  });

  it('aborts in-flight request when country changes before response arrives', async () => {
    let aborted = false;
    mockGet.mockImplementation((_url: string, config: AxiosRequestConfig | undefined) => {
      (config?.signal as AbortSignal | undefined)?.addEventListener('abort', () => {
        aborted = true;
      });
      return new Promise(() => {}); // never resolves
    });

    const { rerender } = renderHook(({ c }) => useCitySearch(c, 'Me'), {
      initialProps: { c: 'CO' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(mockGet).toHaveBeenCalledTimes(1);

    rerender({ c: 'US' });
    expect(aborted).toBe(true);
  });

  it('returns empty results on network error', async () => {
    mockGet.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useCitySearch('CO', 'Me'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it('does not update results when request is cancelled', async () => {
    mockGet.mockRejectedValue(new axios.CanceledError());

    const { result } = renderHook(() => useCitySearch('CO', 'Me'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([]);
  });
});

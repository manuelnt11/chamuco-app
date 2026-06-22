import { act, renderHook } from '@testing-library/react';
import axios, { type AxiosRequestConfig } from 'axios';
import { useTripSearch } from './useTripSearch';

vi.mock('@/services/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/services/api-client';
const mockGet = vi.mocked(apiClient.get);

const mockResult = {
  id: 'trip-1',
  name: 'Cancún 2026',
  description: null,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  confirmedParticipantCount: 2,
  destinations: [{ city: 'Cancún', countryCode: 'MX' }],
  participationStatus: 'none' as const,
};

function apiResponse(data = [mockResult]) {
  return Promise.resolve({ data: { data, total: data.length } });
}

beforeEach(() => {
  vi.useFakeTimers();
  mockGet.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTripSearch', () => {
  it('returns empty results when query is empty', () => {
    const { result } = renderHook(() => useTripSearch(''));
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('returns empty results when query is only whitespace', () => {
    const { result } = renderHook(() => useTripSearch('   '));
    expect(result.current.results).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fires request after 300ms debounce and returns results', async () => {
    mockGet.mockReturnValue(apiResponse());

    const { result } = renderHook(() => useTripSearch('cancun'));

    expect(mockGet).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mockGet).toHaveBeenCalledWith(
      '/v1/trips/search',
      expect.objectContaining({ params: expect.objectContaining({ q: 'cancun' }) }),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([mockResult]);
    expect(result.current.total).toBe(1);
  });

  it('does not fire request within the debounce window', async () => {
    mockGet.mockReturnValue(apiResponse());

    const { rerender } = renderHook(({ q }) => useTripSearch(q), {
      initialProps: { q: 'ca' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    rerender({ q: 'can' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(mockGet).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('aborts in-flight request when query changes', async () => {
    let aborted = false;
    mockGet.mockImplementation((_url: string, config: AxiosRequestConfig | undefined) => {
      (config?.signal as AbortSignal | undefined)?.addEventListener('abort', () => {
        aborted = true;
      });
      return new Promise(() => {});
    });

    const { rerender } = renderHook(({ q }) => useTripSearch(q), {
      initialProps: { q: 'ca' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(mockGet).toHaveBeenCalledTimes(1);

    rerender({ q: 'can' });
    expect(aborted).toBe(true);
  });

  it('returns empty results on network error', async () => {
    mockGet.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useTripSearch('cancun'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it('does not update results when request is cancelled', async () => {
    mockGet.mockRejectedValue(new axios.CanceledError());

    const { result } = renderHook(() => useTripSearch('cancun'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([]);
  });
});

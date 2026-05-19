import { act, renderHook } from '@testing-library/react';
import axios, { type AxiosRequestConfig } from 'axios';
import { useUserSearch } from './useUserSearch';

vi.mock('@/services/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/services/api-client';
const mockGet = vi.mocked(apiClient.get);

const mockResults = [{ id: 'user-1', username: 'janedoe', displayName: 'Jane Doe', avatar: null }];

function apiResponse(data = mockResults) {
  return Promise.resolve({ data: { data, total: data.length } });
}

beforeEach(() => {
  vi.useFakeTimers();
  mockGet.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useUserSearch', () => {
  it('returns empty results when query is empty', () => {
    const { result } = renderHook(() => useUserSearch(''));
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('returns empty results when query is only whitespace', () => {
    const { result } = renderHook(() => useUserSearch('   '));
    expect(result.current.results).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('returns empty results when query is just @', () => {
    const { result } = renderHook(() => useUserSearch('@'));
    expect(result.current.results).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fires request after 300ms debounce and returns results', async () => {
    mockGet.mockReturnValue(apiResponse());

    const { result } = renderHook(() => useUserSearch('jane'));

    expect(mockGet).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mockGet).toHaveBeenCalledWith(
      '/v1/users/search',
      expect.objectContaining({ params: expect.objectContaining({ q: 'jane' }) }),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual(mockResults);
  });

  it('does not fire request within the debounce window', async () => {
    mockGet.mockReturnValue(apiResponse());

    const { rerender } = renderHook(({ q }) => useUserSearch(q), {
      initialProps: { q: 'ja' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    rerender({ q: 'jan' });

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

    const { rerender } = renderHook(({ q }) => useUserSearch(q), {
      initialProps: { q: 'ja' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(mockGet).toHaveBeenCalledTimes(1);

    rerender({ q: 'jan' });
    expect(aborted).toBe(true);
  });

  it('returns empty results on network error', async () => {
    mockGet.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useUserSearch('jane'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it('does not update results when request is cancelled', async () => {
    mockGet.mockRejectedValue(new axios.CanceledError());

    const { result } = renderHook(() => useUserSearch('jane'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([]);
  });
});

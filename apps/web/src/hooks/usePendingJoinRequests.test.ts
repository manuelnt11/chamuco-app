import { renderHook, act, waitFor } from '@testing-library/react';

import { usePendingJoinRequests } from './usePendingJoinRequests';

interface Item {
  id: string;
  name: string;
}

function makeOptions(overrides: {
  fetchRequests?: () => Promise<Item[]>;
  cancelRequest?: (id: string) => Promise<void>;
}) {
  return {
    fetchRequests: overrides.fetchRequests ?? (() => Promise.resolve([])),
    cancelRequest: overrides.cancelRequest ?? (() => Promise.resolve()),
    getId: (item: Item) => item.id,
  };
}

describe('usePendingJoinRequests', () => {
  it('starts in a loading state', () => {
    const { result } = renderHook(() => usePendingJoinRequests(makeOptions({})));
    expect(result.current.isLoading).toBe(true);
  });

  it('populates requests from fetchRequests on mount', async () => {
    const items: Item[] = [{ id: 'a', name: 'A' }];
    const { result } = renderHook(() =>
      usePendingJoinRequests(makeOptions({ fetchRequests: () => Promise.resolve(items) })),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests).toEqual(items);
  });

  it('sets requests to empty array when fetchRequests rejects', async () => {
    const { result } = renderHook(() =>
      usePendingJoinRequests(
        makeOptions({ fetchRequests: () => Promise.reject(new Error('network')) }),
      ),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests).toEqual([]);
  });

  it('cancel removes the item and clears cancellingIds on success', async () => {
    const items: Item[] = [{ id: 'a', name: 'A' }];
    const fetchRequests = vi.fn().mockResolvedValue(items);
    const cancelRequest = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePendingJoinRequests(makeOptions({ fetchRequests, cancelRequest })),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.cancel(items[0]!);
    });

    expect(cancelRequest).toHaveBeenCalledWith('a');
    expect(result.current.requests).toEqual([]);
    expect(result.current.cancellingIds.has('a')).toBe(false);
  });

  it('cancel adds the id to errorIds and keeps the item on failure', async () => {
    const items: Item[] = [{ id: 'a', name: 'A' }];
    const fetchRequests = vi.fn().mockResolvedValue(items);
    const cancelRequest = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() =>
      usePendingJoinRequests(makeOptions({ fetchRequests, cancelRequest })),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.cancel(items[0]!);
    });

    expect(result.current.requests).toEqual(items);
    expect(result.current.errorIds.has('a')).toBe(true);
    expect(result.current.cancellingIds.has('a')).toBe(false);
  });

  it('tracks concurrent cancels on different ids independently', async () => {
    const items: Item[] = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ];
    let resolveA!: () => void;
    const fetchRequests = vi.fn().mockResolvedValue(items);
    const cancelRequest = vi.fn((id: string) => {
      if (id === 'a') return new Promise<void>((resolve) => (resolveA = resolve));
      return Promise.resolve();
    });
    const { result } = renderHook(() =>
      usePendingJoinRequests(makeOptions({ fetchRequests, cancelRequest })),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let cancelAPromise!: Promise<void>;
    act(() => {
      cancelAPromise = result.current.cancel(items[0]!);
    });
    expect(result.current.cancellingIds.has('a')).toBe(true);

    await act(async () => {
      await result.current.cancel(items[1]!);
    });

    // b resolved and was removed; a is still in flight and untouched by b's settle.
    expect(result.current.requests).toEqual([items[0]]);
    expect(result.current.cancellingIds.has('a')).toBe(true);
    expect(result.current.cancellingIds.has('b')).toBe(false);

    await act(async () => {
      resolveA();
      await cancelAPromise;
    });

    expect(result.current.requests).toEqual([]);
    expect(result.current.cancellingIds.size).toBe(0);
  });

  it('refresh re-fetches requests', async () => {
    const fetchRequests = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'a', name: 'A' }])
      .mockResolvedValueOnce([{ id: 'b', name: 'B' }]);
    const { result } = renderHook(() => usePendingJoinRequests(makeOptions({ fetchRequests })));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests).toEqual([{ id: 'a', name: 'A' }]);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.requests).toEqual([{ id: 'b', name: 'B' }]));
    expect(fetchRequests).toHaveBeenCalledTimes(2);
  });
});

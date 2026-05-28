import { act, renderHook, waitFor } from '@testing-library/react';
import { NotificationType } from '@chamuco/shared-types';
import { useNotifications, type NotificationItem } from './useNotifications';

vi.mock('@/services/api-client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

import { apiClient } from '@/services/api-client';
const mockGet = vi.mocked(apiClient.get);
const mockPatch = vi.mocked(apiClient.patch);

function makeNotification(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 'notif-1',
    type: NotificationType.TRIP_INVITATION,
    title: 'New trip invitation',
    body: 'You have been invited to join Summer Trip 2026.',
    url: '/trips/trip-1',
    readAt: null,
    data: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function pageResponse(notifications: NotificationItem[] = [], unreadCount = 0) {
  return Promise.resolve({
    data: { data: notifications, unreadCount },
  });
}

beforeEach(() => {
  mockGet.mockReset();
  mockPatch.mockReset();
  mockGet.mockReturnValue(pageResponse());
  mockPatch.mockResolvedValue({ data: undefined });
});

describe('useNotifications', () => {
  it('fetches notifications on mount', async () => {
    const notif = makeNotification();
    mockGet.mockReturnValue(pageResponse([notif], 1));

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGet).toHaveBeenCalledWith(
      '/v1/notifications',
      expect.objectContaining({ params: { limit: 20 } }),
    );
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
  });

  it('starts with isLoading true on mount', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useNotifications());
    expect(result.current.isLoading).toBe(true);
  });

  it('polls every 30 seconds', async () => {
    vi.useFakeTimers();
    mockGet.mockReturnValue(pageResponse());

    const { unmount } = renderHook(() => useNotifications());

    // flush initial fetch promise
    await act(async () => {
      await Promise.resolve();
    });

    const callCountAfterMount = mockGet.mock.calls.length;
    mockGet.mockReturnValue(pageResponse([makeNotification()], 1));

    await act(async () => {
      vi.advanceTimersByTime(30_000);
      await Promise.resolve();
    });

    expect(mockGet.mock.calls.length).toBeGreaterThan(callCountAfterMount);

    unmount();
    vi.useRealTimers();
  });

  it('re-fetches when chamuco:notification event fires', async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callsBefore = mockGet.mock.calls.length;

    await act(async () => {
      window.dispatchEvent(new window.CustomEvent('chamuco:notification'));
      await Promise.resolve();
    });

    expect(mockGet.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('cancels polling on unmount', async () => {
    vi.useFakeTimers();
    mockGet.mockReturnValue(pageResponse());

    const { unmount } = renderHook(() => useNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    const callCountBeforeUnmount = mockGet.mock.calls.length;
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
    });

    expect(mockGet.mock.calls.length).toBe(callCountBeforeUnmount);
    vi.useRealTimers();
  });

  describe('markRead', () => {
    it('optimistically marks notification as read', async () => {
      const notif = makeNotification({ id: 'notif-1', readAt: null });
      mockGet.mockReturnValue(pageResponse([notif], 1));

      const { result } = renderHook(() => useNotifications());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.markRead('notif-1');
      });

      expect(result.current.notifications[0]!.readAt).not.toBeNull();
      expect(result.current.unreadCount).toBe(0);
    });

    it('does not decrement unreadCount when notification is already read', async () => {
      const readNotif = makeNotification({ id: 'notif-1', readAt: '2026-01-01T00:00:00.000Z' });
      const unreadNotif = makeNotification({ id: 'notif-2', readAt: null });
      // unreadCount=1 (only notif-2 is unread); marking the already-read notif-1 must leave it at 1
      mockGet.mockReturnValue(pageResponse([readNotif, unreadNotif], 1));

      const { result } = renderHook(() => useNotifications());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.markRead('notif-1');
      });

      expect(result.current.unreadCount).toBe(1);
    });

    it('calls PATCH /v1/notifications/:id/read', async () => {
      const notif = makeNotification({ id: 'notif-abc' });
      mockGet.mockReturnValue(pageResponse([notif], 1));

      const { result } = renderHook(() => useNotifications());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.markRead('notif-abc');
      });

      expect(mockPatch).toHaveBeenCalledWith('/v1/notifications/notif-abc/read');
    });
  });

  describe('markAllRead', () => {
    it('optimistically marks all notifications as read', async () => {
      const notifications = [makeNotification({ id: 'n1' }), makeNotification({ id: 'n2' })];
      mockGet.mockReturnValue(pageResponse(notifications, 2));

      const { result } = renderHook(() => useNotifications());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.markAllRead();
      });

      expect(result.current.notifications.every((n) => n.readAt !== null)).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('calls PATCH /v1/notifications/read-all', async () => {
      mockGet.mockReturnValue(pageResponse([makeNotification()], 1));

      const { result } = renderHook(() => useNotifications());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.markAllRead();
      });

      expect(mockPatch).toHaveBeenCalledWith('/v1/notifications/read-all');
    });
  });
});

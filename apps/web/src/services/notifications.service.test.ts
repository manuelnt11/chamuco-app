import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerFcmToken,
  unregisterFcmToken,
} from './notifications.service';
import type { NotificationItem, NotificationsPage } from '@/services/notifications.types';
import { NotificationType } from '@chamuco/shared-types';

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => {
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  const del = vi.fn();
  return { mockGet: get, mockPost: post, mockPatch: patch, mockDelete: del };
});

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

beforeEach(() => {
  mockGet.mockClear();
  mockPost.mockClear();
  mockPatch.mockClear();
  mockDelete.mockClear();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const notificationFixture: NotificationItem = {
  id: 'notif-uuid-1',
  type: NotificationType.GROUP_INVITATION,
  title: 'New group invitation',
  body: 'You were invited to Los Viajeros',
  url: '/groups/group-uuid-1',
  readAt: null,
  data: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const notificationsPageFixture: NotificationsPage = {
  data: [notificationFixture],
  unreadCount: 1,
};

// ─── Notification methods ─────────────────────────────────────────────────────

describe('getNotifications', () => {
  it('gets /v1/notifications with params and returns the page', async () => {
    mockGet.mockResolvedValueOnce({ data: notificationsPageFixture });
    const result = await getNotifications({ limit: 20 });
    expect(mockGet).toHaveBeenCalledWith('/v1/notifications', {
      params: { limit: 20 },
      signal: undefined,
    });
    expect(result).toEqual(notificationsPageFixture);
  });

  it('passes AbortSignal when provided', async () => {
    const controller = new AbortController();
    mockGet.mockResolvedValueOnce({ data: notificationsPageFixture });
    await getNotifications({ limit: 20, signal: controller.signal });
    expect(mockGet).toHaveBeenCalledWith('/v1/notifications', {
      params: { limit: 20 },
      signal: controller.signal,
    });
  });

  it('propagates 401 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(getNotifications({ limit: 20 })).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 404 errors', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getNotifications({ limit: 20 })).rejects.toEqual({ response: { status: 404 } });
  });
});

describe('markNotificationRead', () => {
  it('patches /v1/notifications/:id/read', async () => {
    mockPatch.mockResolvedValueOnce({});
    await markNotificationRead('notif-uuid-1');
    expect(mockPatch).toHaveBeenCalledWith('/v1/notifications/notif-uuid-1/read');
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(markNotificationRead('notif-uuid-1')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(markNotificationRead('notif-uuid-1')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

describe('markAllNotificationsRead', () => {
  it('patches /v1/notifications/read-all', async () => {
    mockPatch.mockResolvedValueOnce({});
    await markAllNotificationsRead();
    expect(mockPatch).toHaveBeenCalledWith('/v1/notifications/read-all');
  });

  it('propagates 401 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(markAllNotificationsRead()).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 500 errors', async () => {
    mockPatch.mockRejectedValueOnce({ response: { status: 500 } });
    await expect(markAllNotificationsRead()).rejects.toEqual({ response: { status: 500 } });
  });
});

// ─── FCM token methods ────────────────────────────────────────────────────────

describe('registerFcmToken', () => {
  it('posts to /v1/notifications/fcm-token with the token', async () => {
    mockPost.mockResolvedValueOnce({});
    await registerFcmToken('fcm-token-abc');
    expect(mockPost).toHaveBeenCalledWith('/v1/notifications/fcm-token', {
      token: 'fcm-token-abc',
    });
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(registerFcmToken('fcm-token-abc')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 422 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(registerFcmToken('fcm-token-abc')).rejects.toEqual({
      response: { status: 422 },
    });
  });
});

describe('unregisterFcmToken', () => {
  it('deletes /v1/notifications/fcm-token with token in request body', async () => {
    mockDelete.mockResolvedValueOnce({});
    await unregisterFcmToken('fcm-token-abc');
    expect(mockDelete).toHaveBeenCalledWith('/v1/notifications/fcm-token', {
      data: { token: 'fcm-token-abc' },
    });
  });

  it('propagates 401 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(unregisterFcmToken('fcm-token-abc')).rejects.toEqual({
      response: { status: 401 },
    });
  });

  it('propagates 404 errors', async () => {
    mockDelete.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(unregisterFcmToken('fcm-token-abc')).rejects.toEqual({
      response: { status: 404 },
    });
  });
});

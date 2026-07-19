import { renderHook, act } from '@testing-library/react';
import type { MessagePayload } from 'firebase/messaging';

vi.mock('firebase/messaging', () => ({
  getToken: vi.fn(),
  onMessage: vi.fn(() => vi.fn()),
  deleteToken: vi.fn(),
}));

vi.mock('@/lib/firebase/firebase', () => ({
  getFirebaseMessaging: vi.fn(),
}));

vi.mock('@/store/auth', () => ({
  registerBeforeSignOut: vi.fn(() => vi.fn()),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/config/env', () => ({
  env: { NEXT_PUBLIC_FIREBASE_VAPID_KEY: 'test-vapid-key' },
}));

import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/lib/firebase/firebase';
import { registerBeforeSignOut } from '@/store/auth';
import { apiClient } from '@/services/api-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/toast';
import { usePushNotifications } from './usePushNotifications';

const mockMessaging = {};
const mockUser = { uid: 'user-1' };
const mockSwReg = {};

function setupBrowserEnv(permissionResult: NotificationPermission = 'granted') {
  Object.defineProperty(window, 'Notification', {
    value: { requestPermission: vi.fn().mockResolvedValue(permissionResult) },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { ready: Promise.resolve(mockSwReg) },
    configurable: true,
    writable: true,
  });
}

describe('usePushNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFirebaseMessaging).mockReturnValue(mockMessaging as never);
    vi.mocked(getToken).mockResolvedValue('fcm-token-abc');
    vi.mocked(onMessage).mockReturnValue(vi.fn());
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.mocked(apiClient.delete).mockResolvedValue({});
    vi.mocked(registerBeforeSignOut).mockReturnValue(vi.fn());
  });

  it('does nothing when currentUser is null', () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: null } as never);
    setupBrowserEnv();

    renderHook(() => usePushNotifications());

    expect(getToken).not.toHaveBeenCalled();
  });

  it('does nothing when Notification API is absent', () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: mockUser } as never);
    const originalNotification = window.Notification;
    // @ts-expect-error — intentionally removing Notification for this test
    delete window.Notification;

    renderHook(() => usePushNotifications());

    expect(getToken).not.toHaveBeenCalled();
    Object.defineProperty(window, 'Notification', {
      value: originalNotification,
      configurable: true,
      writable: true,
    });
  });

  it('does nothing when getFirebaseMessaging returns null', () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: mockUser } as never);
    vi.mocked(getFirebaseMessaging).mockReturnValue(null);
    setupBrowserEnv();

    renderHook(() => usePushNotifications());

    expect(getToken).not.toHaveBeenCalled();
  });

  it('does nothing when permission is denied', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: mockUser } as never);
    setupBrowserEnv('denied');

    await act(async () => {
      renderHook(() => usePushNotifications());
    });

    expect(getToken).not.toHaveBeenCalled();
  });

  it('requests permission, gets token, and registers it with the API', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: mockUser } as never);
    setupBrowserEnv('granted');

    await act(async () => {
      renderHook(() => usePushNotifications());
    });

    expect(Notification.requestPermission).toHaveBeenCalledTimes(1);
    expect(getToken).toHaveBeenCalledWith(mockMessaging, {
      vapidKey: 'test-vapid-key',
      serviceWorkerRegistration: mockSwReg,
    });
    expect(apiClient.post).toHaveBeenCalledWith('/v1/notifications/fcm-token', {
      token: 'fcm-token-abc',
    });
  });

  it('subscribes to foreground messages and shows a toast', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: mockUser } as never);
    setupBrowserEnv('granted');

    let capturedHandler: ((payload: MessagePayload) => void) | null = null;
    vi.mocked(onMessage).mockImplementation((_messaging, handler) => {
      capturedHandler = handler as (payload: MessagePayload) => void;
      return vi.fn();
    });

    await act(async () => {
      renderHook(() => usePushNotifications());
    });

    expect(onMessage).toHaveBeenCalledWith(mockMessaging, expect.any(Function));

    act(() => {
      capturedHandler?.({ data: { title: 'Hello', body: 'World' } } as unknown as MessagePayload);
    });

    expect(toast.info).toHaveBeenCalledWith('Hello', 'World');
  });

  it('dispatches chamuco:notification event on foreground message', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: mockUser } as never);
    setupBrowserEnv('granted');

    let capturedHandler: ((payload: MessagePayload) => void) | null = null;
    vi.mocked(onMessage).mockImplementation((_messaging, handler) => {
      capturedHandler = handler as (payload: MessagePayload) => void;
      return vi.fn();
    });

    await act(async () => {
      renderHook(() => usePushNotifications());
    });

    const listener = vi.fn();
    window.addEventListener('chamuco:notification', listener);

    act(() => {
      capturedHandler?.({ data: { title: 'Hello' } } as unknown as MessagePayload);
    });

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('chamuco:notification', listener);
  });

  it('uses fallback title when notification has no title', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: mockUser } as never);
    setupBrowserEnv('granted');

    let capturedHandler: ((payload: MessagePayload) => void) | null = null;
    vi.mocked(onMessage).mockImplementation((_messaging, handler) => {
      capturedHandler = handler as (payload: MessagePayload) => void;
      return vi.fn();
    });

    await act(async () => {
      renderHook(() => usePushNotifications());
    });

    act(() => {
      capturedHandler?.({ data: {} } as unknown as MessagePayload);
    });

    expect(toast.info).toHaveBeenCalledWith('Notification', undefined);
  });

  it('beforeSignOut callback deletes token from API and Firebase', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: mockUser } as never);
    setupBrowserEnv('granted');

    let capturedBeforeSignOut: (() => Promise<void>) | null = null;
    vi.mocked(registerBeforeSignOut).mockImplementation((cb) => {
      capturedBeforeSignOut = cb;
      return vi.fn();
    });

    await act(async () => {
      renderHook(() => usePushNotifications());
    });

    await act(async () => {
      await capturedBeforeSignOut?.();
    });

    expect(apiClient.delete).toHaveBeenCalledWith('/v1/notifications/fcm-token', {
      data: { token: 'fcm-token-abc' },
    });
    expect(deleteToken).toHaveBeenCalledWith(mockMessaging);
  });

  it('cleanup unsubscribes foreground listener and unregisters beforeSignOut', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: mockUser } as never);
    setupBrowserEnv('granted');

    const unsubscribeForeground = vi.fn();
    vi.mocked(onMessage).mockReturnValue(unsubscribeForeground);

    const unregisterBeforeSignOut = vi.fn();
    vi.mocked(registerBeforeSignOut).mockReturnValue(unregisterBeforeSignOut);

    const { unmount } = await act(async () => renderHook(() => usePushNotifications()));

    unmount();

    expect(unsubscribeForeground).toHaveBeenCalledTimes(1);
    expect(unregisterBeforeSignOut).toHaveBeenCalledTimes(1);
  });

  it('logs error to console when getToken fails', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: mockUser } as never);
    setupBrowserEnv('granted');
    vi.mocked(getToken).mockRejectedValue(new Error('SW not registered'));

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await act(async () => {
      renderHook(() => usePushNotifications());
    });

    expect(consoleError).toHaveBeenCalledWith(
      '[usePushNotifications] FCM init failed:',
      expect.any(Error),
    );

    consoleError.mockRestore();
  });

  it('does not log error when effect is cancelled before init completes', async () => {
    vi.mocked(useAuth).mockReturnValue({ currentUser: mockUser } as never);

    let resolvePermission!: (value: NotificationPermission) => void;
    Object.defineProperty(window, 'Notification', {
      value: {
        requestPermission: vi.fn(
          () => new Promise<NotificationPermission>((res) => (resolvePermission = res)),
        ),
      },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve(mockSwReg) },
      configurable: true,
      writable: true,
    });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { unmount } = renderHook(() => usePushNotifications());
    unmount();

    await act(async () => {
      resolvePermission('granted');
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

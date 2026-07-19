import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationType } from '@chamuco/shared-types';
import type { NotificationItem } from '@chamuco/shared-types';
import { NotificationPanel } from './NotificationPanel';

// --- hoisted mocks ---

const mocks = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.mockRouterPush }),
}));

// --- helpers ---

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

function renderPanel(
  notifications: NotificationItem[] = [],
  overrides: {
    isLoading?: boolean;
    onMarkRead?: (id: string) => void;
    onMarkAllRead?: () => void;
  } = {},
) {
  const onMarkRead = overrides.onMarkRead ?? vi.fn();
  const onMarkAllRead = overrides.onMarkAllRead ?? vi.fn();
  render(
    <NotificationPanel
      notifications={notifications}
      isLoading={overrides.isLoading ?? false}
      onMarkRead={onMarkRead}
      onMarkAllRead={onMarkAllRead}
    />,
  );
  return { onMarkRead, onMarkAllRead };
}

// ---

describe('NotificationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('shows empty state text when there are no notifications', () => {
      renderPanel([]);
      expect(screen.getByText('notifications.empty')).toBeInTheDocument();
    });

    it('does not render any notification rows when empty', () => {
      renderPanel([]);
      expect(screen.queryAllByRole('button', { name: /trip invitation/i })).toHaveLength(0);
    });
  });

  describe('loading state', () => {
    it('shows loading skeleton when isLoading and no notifications', () => {
      renderPanel([], { isLoading: true });
      expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('shows notifications if present even when isLoading', () => {
      const notif = makeNotification();
      renderPanel([notif], { isLoading: true });
      expect(screen.getByText(notif.title)).toBeInTheDocument();
    });
  });

  describe('notification rows', () => {
    it('renders title and body for each notification', () => {
      const notif = makeNotification({ title: 'Trip invite', body: 'Join us!' });
      renderPanel([notif]);
      expect(screen.getByText('Trip invite')).toBeInTheDocument();
      expect(screen.getByText('Join us!')).toBeInTheDocument();
    });

    it('renders unread indicator dot for unread notifications', () => {
      const notif = makeNotification({ readAt: null });
      renderPanel([notif]);
      expect(screen.getByLabelText('unread')).toBeInTheDocument();
    });

    it('does not render unread dot for read notifications', () => {
      const notif = makeNotification({ readAt: '2026-01-01T00:00:00.000Z' });
      renderPanel([notif]);
      expect(screen.queryByLabelText('unread')).not.toBeInTheDocument();
    });

    it('renders multiple notifications', () => {
      const notifications = [
        makeNotification({ id: 'n1', title: 'First' }),
        makeNotification({ id: 'n2', title: 'Second' }),
      ];
      renderPanel(notifications);
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onMarkRead with notification id on row click', async () => {
      const user = userEvent.setup();
      const notif = makeNotification({ id: 'notif-abc' });
      const { onMarkRead } = renderPanel([notif]);

      await user.click(screen.getByText(notif.title));
      expect(onMarkRead).toHaveBeenCalledWith('notif-abc');
    });

    it('navigates to url on row click when url is present', async () => {
      const user = userEvent.setup();
      const notif = makeNotification({
        type: NotificationType.GROUP_INVITATION,
        url: '/groups/g1',
      });
      renderPanel([notif]);

      await user.click(screen.getByText(notif.title));
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/groups/g1');
    });

    it('navigates to /trips for TRIP_INVITATION regardless of notif.url', async () => {
      const user = userEvent.setup();
      const notif = makeNotification({
        type: NotificationType.TRIP_INVITATION,
        url: '/trips/trip-1',
      });
      renderPanel([notif]);

      await user.click(screen.getByText(notif.title));
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/trips');
      expect(mocks.mockRouterPush).not.toHaveBeenCalledWith('/trips/trip-1');
    });

    it('navigates to /trips for TRIP_INVITATION even when url is null', async () => {
      const user = userEvent.setup();
      const notif = makeNotification({ type: NotificationType.TRIP_INVITATION, url: null });
      renderPanel([notif]);

      await user.click(screen.getByText(notif.title));
      expect(mocks.mockRouterPush).toHaveBeenCalledWith('/trips');
    });

    it('does not navigate when url is null for non-TRIP_INVITATION', async () => {
      const user = userEvent.setup();
      const notif = makeNotification({ type: NotificationType.GROUP_INVITATION, url: null });
      renderPanel([notif]);

      await user.click(screen.getByText(notif.title));
      expect(mocks.mockRouterPush).not.toHaveBeenCalled();
    });

    it('calls onMarkAllRead when "mark all" button is clicked', async () => {
      const user = userEvent.setup();
      const notif = makeNotification({ readAt: null });
      const { onMarkAllRead } = renderPanel([notif]);

      await user.click(screen.getByText('notifications.markAllRead'));
      expect(onMarkAllRead).toHaveBeenCalledOnce();
    });

    it('"mark all" button is disabled when all notifications are already read', () => {
      const notif = makeNotification({ readAt: '2026-01-01T00:00:00.000Z' });
      renderPanel([notif]);
      expect(screen.getByText('notifications.markAllRead')).toBeDisabled();
    });

    it('"mark all" button is not disabled when there are unread notifications', () => {
      const notif = makeNotification({ readAt: null });
      renderPanel([notif]);
      expect(screen.getByText('notifications.markAllRead')).not.toBeDisabled();
    });
  });

  describe('panel header', () => {
    it('renders the notifications title', () => {
      renderPanel([]);
      expect(screen.getByText('notifications.title')).toBeInTheDocument();
    });

    it('renders the mark all read button', () => {
      renderPanel([]);
      expect(screen.getByText('notifications.markAllRead')).toBeInTheDocument();
    });
  });

  describe('relative timestamp formatting', () => {
    it('shows seconds for recent notifications', () => {
      const notif = makeNotification({ createdAt: new Date(Date.now() - 30_000).toISOString() });
      renderPanel([notif]);
      expect(screen.getByText('30s')).toBeInTheDocument();
    });

    it('shows minutes for notifications older than a minute', () => {
      const notif = makeNotification({
        createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      });
      renderPanel([notif]);
      expect(screen.getByText('5m')).toBeInTheDocument();
    });

    it('shows hours for notifications older than an hour', () => {
      const notif = makeNotification({
        createdAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
      });
      renderPanel([notif]);
      expect(screen.getByText('3h')).toBeInTheDocument();
    });

    it('shows days for notifications older than a day', () => {
      const notif = makeNotification({
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString(),
      });
      renderPanel([notif]);
      expect(screen.getByText('2d')).toBeInTheDocument();
    });
  });

  describe('notification types', () => {
    const allTypes = [
      NotificationType.TRIP_INVITATION,
      NotificationType.TRIP_ANNOUNCEMENT,
      NotificationType.TRIP_KEY_DATE_REMINDER,
      NotificationType.TRIP_COMPLETED,
      NotificationType.GROUP_INVITATION,
      NotificationType.GROUP_JOIN_ACCEPTED,
      NotificationType.GROUP_ANNOUNCEMENT,
      NotificationType.PASSPORT_EXPIRING_SOON,
      NotificationType.PASSPORT_EXPIRED,
      NotificationType.ACHIEVEMENT_UNLOCKED,
    ];

    allTypes.forEach((type) => {
      it(`renders icon for ${type}`, () => {
        const notif = makeNotification({ type, title: `Notif ${type}` });
        renderPanel([notif]);
        expect(screen.getByText(`Notif ${type}`)).toBeInTheDocument();
      });
    });
  });
});

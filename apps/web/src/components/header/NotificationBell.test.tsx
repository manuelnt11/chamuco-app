import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import type { NotificationItem } from '@/hooks/useNotifications';
import { NotificationBell } from './NotificationBell';

// --- hoisted mocks ---

const mocks = vi.hoisted(() => ({
  mockMarkRead: vi.fn(),
  mockMarkAllRead: vi.fn(),
  mockNotifications: [] as NotificationItem[],
  mockUnreadCount: 0,
  mockIsLoading: false,
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: mocks.mockNotifications,
    unreadCount: mocks.mockUnreadCount,
    isLoading: mocks.mockIsLoading,
    markRead: mocks.mockMarkRead,
    markAllRead: mocks.mockMarkAllRead,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}(${JSON.stringify(opts)})` : key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
  PopoverContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
}));

vi.mock('./NotificationPanel', () => ({
  NotificationPanel: () => <div data-testid="notification-panel">Panel</div>,
}));

// ---

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockNotifications = [];
  mocks.mockUnreadCount = 0;
  mocks.mockIsLoading = false;
});

describe('NotificationBell', () => {
  it('renders a button with accessible label', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button', { name: 'notifications.openLabel' })).toBeInTheDocument();
  });

  it('does not show badge when unreadCount is 0', () => {
    mocks.mockUnreadCount = 0;
    render(<NotificationBell />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });

  it('shows badge with count when unreadCount > 0', () => {
    mocks.mockUnreadCount = 5;
    render(<NotificationBell />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('caps badge display at 99+ for counts > 99', () => {
    mocks.mockUnreadCount = 150;
    render(<NotificationBell />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('shows exact count 99 without cap', () => {
    mocks.mockUnreadCount = 99;
    render(<NotificationBell />);
    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('renders the notification panel inside the popover content', () => {
    render(<NotificationBell />);
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
  });
});

import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

const STORAGE_KEY = 'chamuco_pwa_prompt_dismissed_at';
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
const PERMANENT_SUPPRESS = String(Number.MAX_SAFE_INTEGER);

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
}

function mockMatchMedia(standalone: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query === '(display-mode: standalone)' ? standalone : false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  });
}

import { IosPwaPrompt } from './IosPwaPrompt';

beforeEach(() => {
  localStorage.clear();
  mockMatchMedia(false);
  // default: non-iOS UA
  setUserAgent(
    'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  );
  vi.spyOn(window, 'addEventListener').mockImplementation(vi.fn());
  vi.spyOn(window, 'removeEventListener').mockImplementation(vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

// --- helpers ---

const IOS_SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function fireBeforeInstallPrompt() {
  const calls = (window.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
  const entry = calls.find((args: unknown[]) => args[0] === 'beforeinstallprompt');
  if (!entry) throw new Error('beforeinstallprompt listener not registered');
  const handler = entry[1] as (e: Event) => void;
  const mockPrompt = vi.fn().mockResolvedValue(undefined);
  const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const });
  const fakeEvent = Object.assign(new Event('beforeinstallprompt'), {
    preventDefault: vi.fn(),
    prompt: mockPrompt,
    userChoice: mockUserChoice,
  });
  act(() => handler(fakeEvent));
  return { fakeEvent, mockPrompt, mockUserChoice };
}

// --- tests ---

describe('IosPwaPrompt', () => {
  describe('standalone mode', () => {
    it('renders nothing when already in standalone mode', () => {
      mockMatchMedia(true);
      render(<IosPwaPrompt />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('iOS Safari', () => {
    beforeEach(() => setUserAgent(IOS_SAFARI_UA));

    it('shows the prompt on iOS Safari when not dismissed', () => {
      render(<IosPwaPrompt />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows the share instruction (not install button) on iOS', () => {
      render(<IosPwaPrompt />);
      expect(screen.getByText('installPrompt.instruction')).toBeInTheDocument();
      expect(screen.queryByText('installPrompt.install')).not.toBeInTheDocument();
    });

    it('hides after dismiss and stores timestamp', () => {
      render(<IosPwaPrompt />);
      fireEvent.click(screen.getByLabelText('installPrompt.dismiss'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      expect(Number(stored)).toBeCloseTo(Date.now(), -3);
    });

    it('does not show when dismissed within cooldown period', () => {
      localStorage.setItem(STORAGE_KEY, String(Date.now() - COOLDOWN_MS / 2));
      render(<IosPwaPrompt />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows again when cooldown has expired', () => {
      localStorage.setItem(STORAGE_KEY, String(Date.now() - COOLDOWN_MS - 1000));
      render(<IosPwaPrompt />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not show when permanently suppressed', () => {
      localStorage.setItem(STORAGE_KEY, PERMANENT_SUPPRESS);
      render(<IosPwaPrompt />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Android / beforeinstallprompt', () => {
    it('does not show before beforeinstallprompt fires', () => {
      render(<IosPwaPrompt />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows the prompt after beforeinstallprompt fires', () => {
      render(<IosPwaPrompt />);
      fireBeforeInstallPrompt();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows Install button (not share instruction) on Android', () => {
      render(<IosPwaPrompt />);
      fireBeforeInstallPrompt();
      expect(screen.getByText('installPrompt.install')).toBeInTheDocument();
      expect(screen.queryByText('installPrompt.instruction')).not.toBeInTheDocument();
    });

    it('calls deferredPrompt.prompt() and stores permanent suppress when accepted', async () => {
      render(<IosPwaPrompt />);
      const { fakeEvent } = fireBeforeInstallPrompt();
      fireEvent.click(screen.getByText('installPrompt.install'));
      await waitFor(() => expect(fakeEvent.prompt).toHaveBeenCalledOnce());
      await waitFor(() => expect(localStorage.getItem(STORAGE_KEY)).toBe(PERMANENT_SUPPRESS));
    });

    it('stores cooldown timestamp when user dismisses via X button', () => {
      render(<IosPwaPrompt />);
      fireBeforeInstallPrompt();
      fireEvent.click(screen.getByLabelText('installPrompt.dismiss'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      expect(Number(stored)).not.toBe(Number(PERMANENT_SUPPRESS));
    });

    it('stores cooldown timestamp when user dismisses via "Not now" button', () => {
      render(<IosPwaPrompt />);
      fireBeforeInstallPrompt();
      fireEvent.click(screen.getByText('installPrompt.dismiss'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      expect(Number(stored)).not.toBe(Number(PERMANENT_SUPPRESS));
    });

    it('does not register beforeinstallprompt listener when within cooldown period', () => {
      localStorage.setItem(STORAGE_KEY, String(Date.now() - COOLDOWN_MS / 2));
      render(<IosPwaPrompt />);
      // shouldShow() returns false so the listener is never added
      const calls = (window.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
      const hasListener = calls.some((args: unknown[]) => args[0] === 'beforeinstallprompt');
      expect(hasListener).toBe(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('removes the beforeinstallprompt listener on unmount', () => {
      const { unmount } = render(<IosPwaPrompt />);
      unmount();
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function),
      );
    });
  });
});

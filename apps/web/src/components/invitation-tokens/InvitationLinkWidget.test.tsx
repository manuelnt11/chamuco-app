import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { InvitationTokenContext } from '@chamuco/shared-types';
import { InvitationLinkWidget } from './InvitationLinkWidget';

const mocks = vi.hoisted(() => ({
  mockCreateToken: vi.fn(),
  mockGetOpenToken: vi.fn(),
  mockToggleToken: vi.fn(),
  mockToastError: vi.fn(),
  mockClipboard: vi.fn(),
  mockShare: vi.fn(),
}));

vi.mock('@/services/invitation-tokens.service', () => ({
  createInvitationToken: mocks.mockCreateToken,
  getOpenInvitationToken: mocks.mockGetOpenToken,
  toggleInvitationToken: mocks.mockToggleToken,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
  DialogPopup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogClose: () => null,
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { error: mocks.mockToastError },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const STORAGE_ID = 'test-id';
const TOKEN = 'abc123';
const TOKEN_URL = `http://localhost:3000/join?token=${TOKEN}`;
const CACHED_DATA = { token: TOKEN, url: TOKEN_URL, isActive: true };
const CACHED_KEY = `chamuco_invite_referral_${STORAGE_ID}`;

function renderWidget(contextType: InvitationTokenContext, contextId?: string, showToggle = false) {
  return render(
    <InvitationLinkWidget
      contextType={contextType}
      contextId={contextId}
      storageId={STORAGE_ID}
      showToggle={showToggle}
    />,
  );
}

describe('InvitationLinkWidget', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.mockCreateToken.mockClear();
    mocks.mockGetOpenToken.mockClear();
    mocks.mockGetOpenToken.mockResolvedValue(null);
    mocks.mockToggleToken.mockClear();
    mocks.mockToggleToken.mockResolvedValue(undefined);
    mocks.mockToastError.mockClear();
    mocks.mockClipboard.mockClear();
    mocks.mockShare.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mocks.mockClipboard.mockResolvedValue(undefined) },
      writable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: mocks.mockShare.mockResolvedValue(undefined),
      writable: true,
      configurable: true,
    });
  });

  describe('loading existing link', () => {
    it('shows generate button when backend returns null', async () => {
      await renderWidget(InvitationTokenContext.REFERRAL);
      await waitFor(() => {
        expect(screen.getByText('invitationLink.generate')).toBeInTheDocument();
      });
    });

    it('restores from localStorage without calling backend', async () => {
      localStorage.setItem(CACHED_KEY, JSON.stringify(CACHED_DATA));
      await renderWidget(InvitationTokenContext.REFERRAL);
      expect(screen.getByRole('textbox')).toHaveValue(TOKEN_URL);
      expect(mocks.mockGetOpenToken).not.toHaveBeenCalled();
    });

    it('loads from backend when not cached and stores as JSON', async () => {
      mocks.mockGetOpenToken.mockResolvedValueOnce(CACHED_DATA);
      await renderWidget(InvitationTokenContext.REFERRAL);
      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(TOKEN_URL));
      expect(JSON.parse(localStorage.getItem(CACHED_KEY)!)).toMatchObject(CACHED_DATA);
    });

    it('clears corrupted localStorage entry and calls backend', async () => {
      localStorage.setItem(CACHED_KEY, 'not-json{{{');
      mocks.mockGetOpenToken.mockResolvedValueOnce(CACHED_DATA);
      await renderWidget(InvitationTokenContext.REFERRAL);
      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(TOKEN_URL));
    });
  });

  describe('generate', () => {
    it('creates token and persists JSON to localStorage', async () => {
      mocks.mockCreateToken.mockResolvedValueOnce(CACHED_DATA);
      await renderWidget(InvitationTokenContext.REFERRAL);
      await waitFor(() => screen.getByText('invitationLink.generate'));
      await userEvent.click(screen.getByText('invitationLink.generate'));
      await waitFor(() => {
        expect(mocks.mockCreateToken).toHaveBeenCalledWith({
          contextType: InvitationTokenContext.REFERRAL,
          contextId: undefined,
        });
      });
      expect(JSON.parse(localStorage.getItem(CACHED_KEY)!)).toMatchObject(CACHED_DATA);
    });

    it('shows error toast on failure', async () => {
      mocks.mockCreateToken.mockRejectedValueOnce(new Error('fail'));
      await renderWidget(InvitationTokenContext.REFERRAL);
      await waitFor(() => screen.getByText('invitationLink.generate'));
      await userEvent.click(screen.getByText('invitationLink.generate'));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('invitationLink.generateError'),
      );
    });

    it('passes contextId for trip context', async () => {
      const TRIP_ID = 'trip-uuid';
      mocks.mockCreateToken.mockResolvedValueOnce({ ...CACHED_DATA });
      await renderWidget(InvitationTokenContext.TRIP, TRIP_ID);
      await waitFor(() => screen.getByText('invitationLink.generate'));
      await userEvent.click(screen.getByText('invitationLink.generate'));
      await waitFor(() =>
        expect(mocks.mockCreateToken).toHaveBeenCalledWith({
          contextType: InvitationTokenContext.TRIP,
          contextId: TRIP_ID,
        }),
      );
    });
  });

  describe('action button — share vs copy fallback', () => {
    beforeEach(() => localStorage.setItem(CACHED_KEY, JSON.stringify(CACHED_DATA)));

    it('shows share button when navigator.share available', async () => {
      await renderWidget(InvitationTokenContext.REFERRAL);
      expect(screen.getByRole('button', { name: 'invitationLink.share' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'invitationLink.copy' })).not.toBeInTheDocument();
    });

    it('calls navigator.share with url and context-specific text', async () => {
      await renderWidget(InvitationTokenContext.REFERRAL);
      await userEvent.click(screen.getByRole('button', { name: 'invitationLink.share' }));
      expect(mocks.mockShare).toHaveBeenCalledWith({
        url: TOKEN_URL,
        text: 'invitationLink.shareText.referral',
      });
    });

    it('ignores AbortError when user dismisses share sheet', async () => {
      const abortError = Object.assign(new Error('Share canceled'), { name: 'AbortError' });
      mocks.mockShare.mockRejectedValueOnce(abortError);
      await renderWidget(InvitationTokenContext.REFERRAL);
      await userEvent.click(screen.getByRole('button', { name: 'invitationLink.share' }));
      await waitFor(() => expect(mocks.mockShare).toHaveBeenCalled());
      expect(mocks.mockToastError).not.toHaveBeenCalled();
    });

    it('shows copy button when navigator.share unavailable', async () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      await renderWidget(InvitationTokenContext.REFERRAL);
      expect(screen.getByRole('button', { name: 'invitationLink.copy' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'invitationLink.share' }),
      ).not.toBeInTheDocument();
    });

    it('copies url to clipboard when copy button clicked', async () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      await renderWidget(InvitationTokenContext.REFERRAL);
      await userEvent.click(screen.getByRole('button', { name: 'invitationLink.copy' }));
      expect(mocks.mockClipboard).toHaveBeenCalledWith(TOKEN_URL);
    });

    it('disables share button when link is inactive', async () => {
      localStorage.setItem(CACHED_KEY, JSON.stringify({ ...CACHED_DATA, isActive: false }));
      await renderWidget(InvitationTokenContext.REFERRAL);
      expect(screen.getByRole('button', { name: 'invitationLink.share' })).toBeDisabled();
    });
  });

  describe('invite by email modal', () => {
    beforeEach(() => localStorage.setItem(CACHED_KEY, JSON.stringify(CACHED_DATA)));

    it('opens modal when invite button clicked', async () => {
      await renderWidget(InvitationTokenContext.REFERRAL);
      await userEvent.click(screen.getByRole('button', { name: 'invitationLink.invite.button' }));
      expect(screen.getByText('invitationLink.invite.title')).toBeInTheDocument();
    });

    it('sends invite and shows success', async () => {
      mocks.mockCreateToken.mockResolvedValueOnce({ token: 'x', url: 'u', isActive: true });
      await renderWidget(InvitationTokenContext.REFERRAL);
      await userEvent.click(screen.getByRole('button', { name: 'invitationLink.invite.button' }));
      await userEvent.type(
        screen.getByRole('textbox', { name: 'invitationLink.invite.emailLabel' }),
        'friend@example.com',
      );
      await userEvent.click(screen.getByText('invitationLink.invite.send'));
      await waitFor(() => {
        expect(mocks.mockCreateToken).toHaveBeenCalledWith(
          expect.objectContaining({ recipientEmail: 'friend@example.com' }),
        );
      });
      expect(screen.getByText('invitationLink.invite.success')).toBeInTheDocument();
    });

    it('shows errorAlreadyRegistered on 409', async () => {
      mocks.mockCreateToken.mockRejectedValueOnce({ response: { status: 409 } });
      await renderWidget(InvitationTokenContext.REFERRAL);
      await userEvent.click(screen.getByRole('button', { name: 'invitationLink.invite.button' }));
      await userEvent.type(
        screen.getByRole('textbox', { name: 'invitationLink.invite.emailLabel' }),
        'existing@example.com',
      );
      await userEvent.click(screen.getByText('invitationLink.invite.send'));
      await waitFor(() => {
        expect(
          screen.getByText('invitationLink.invite.errorAlreadyRegistered'),
        ).toBeInTheDocument();
      });
    });

    it('shows errorGeneric on other errors', async () => {
      mocks.mockCreateToken.mockRejectedValueOnce({ response: { status: 500 } });
      await renderWidget(InvitationTokenContext.REFERRAL);
      await userEvent.click(screen.getByRole('button', { name: 'invitationLink.invite.button' }));
      await userEvent.type(
        screen.getByRole('textbox', { name: 'invitationLink.invite.emailLabel' }),
        'user@example.com',
      );
      await userEvent.click(screen.getByText('invitationLink.invite.send'));
      await waitFor(() => {
        expect(screen.getByText('invitationLink.invite.errorGeneric')).toBeInTheDocument();
      });
    });
  });

  describe('toggle (showToggle=true)', () => {
    beforeEach(() => localStorage.setItem(CACHED_KEY, JSON.stringify(CACHED_DATA)));

    it('does not show toggle button when showToggle is false', async () => {
      await renderWidget(InvitationTokenContext.REFERRAL, undefined, false);
      expect(screen.queryByText('invitationLink.disable')).not.toBeInTheDocument();
    });

    it('shows disable button when link is active', async () => {
      await renderWidget(InvitationTokenContext.REFERRAL, undefined, true);
      expect(screen.getByText('invitationLink.disable')).toBeInTheDocument();
    });

    it('shows enable button when link is inactive', async () => {
      localStorage.setItem(CACHED_KEY, JSON.stringify({ ...CACHED_DATA, isActive: false }));
      await renderWidget(InvitationTokenContext.REFERRAL, undefined, true);
      expect(screen.getByText('invitationLink.enable')).toBeInTheDocument();
    });

    it('calls toggleInvitationToken and flips isActive', async () => {
      await renderWidget(InvitationTokenContext.REFERRAL, undefined, true);
      await userEvent.click(screen.getByText('invitationLink.disable'));
      await waitFor(() => {
        expect(mocks.mockToggleToken).toHaveBeenCalledWith(TOKEN);
      });
      expect(screen.getByText('invitationLink.enable')).toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem(CACHED_KEY)!).isActive).toBe(false);
    });

    it('shows error toast on toggle failure', async () => {
      mocks.mockToggleToken.mockRejectedValueOnce(new Error('fail'));
      await renderWidget(InvitationTokenContext.REFERRAL, undefined, true);
      await userEvent.click(screen.getByText('invitationLink.disable'));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('invitationLink.toggleError'),
      );
    });
  });
});

import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError } from 'axios';

const mocks = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockIsAxiosError: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { post: mocks.mockPost },
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    success: mocks.mockToastSuccess,
    error: mocks.mockToastError,
  },
}));

vi.mock('axios', async (importOriginal) => {
  const original = await importOriginal<typeof import('axios')>();
  return { ...original, isAxiosError: mocks.mockIsAxiosError };
});

// Mock Dialog to render inline (no portals) so state updates work predictably
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: ReactNode;
    open: boolean;
    onOpenChange?: (v: boolean) => void;
  }) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogClose: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  DialogPopup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

import { FeedbackModal } from '@/components/feedback/FeedbackModal';

function makeAxiosError(status: number): AxiosError {
  const err = new AxiosError('Request failed');
  // @ts-expect-error - partial Axios error for testing
  err.response = { status };
  return err;
}

describe('FeedbackModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockIsAxiosError.mockReturnValue(false);
  });

  describe('visibility', () => {
    it('renders dialog content when open=true', () => {
      render(<FeedbackModal open onClose={onClose} />);
      expect(screen.getByText('modal.title')).toBeInTheDocument();
    });

    it('does not render content when open=false', () => {
      render(<FeedbackModal open={false} onClose={onClose} />);
      expect(screen.queryByText('modal.title')).not.toBeInTheDocument();
    });
  });

  describe('dismissal', () => {
    it('cancel button calls onClose and resets comment', async () => {
      const user = userEvent.setup();
      render(<FeedbackModal open onClose={onClose} />);
      await user.type(screen.getByPlaceholderText('modal.placeholder'), 'Some text I typed here.');
      await user.click(screen.getByRole('button', { name: 'modal.cancel' }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('submit button is disabled when comment is empty', () => {
      render(<FeedbackModal open onClose={onClose} />);
      expect(screen.getByRole('button', { name: 'modal.submit' })).toBeDisabled();
    });

    it('submit button is disabled when comment is less than 10 characters', async () => {
      const user = userEvent.setup();
      render(<FeedbackModal open onClose={onClose} />);
      await user.type(screen.getByPlaceholderText('modal.placeholder'), 'short');
      expect(screen.getByRole('button', { name: 'modal.submit' })).toBeDisabled();
    });

    it('shows tooShort error when 1-9 characters are entered', async () => {
      const user = userEvent.setup();
      render(<FeedbackModal open onClose={onClose} />);
      await user.type(screen.getByPlaceholderText('modal.placeholder'), 'short');
      expect(screen.getByText('errors.tooShort')).toBeInTheDocument();
    });

    it('submit button is enabled when comment has 10+ characters', async () => {
      const user = userEvent.setup();
      render(<FeedbackModal open onClose={onClose} />);
      await user.type(
        screen.getByPlaceholderText('modal.placeholder'),
        'This is a valid feedback comment.',
      );
      expect(screen.getByRole('button', { name: 'modal.submit' })).toBeEnabled();
    });

    it('does not show tooShort error when 10+ chars entered', async () => {
      const user = userEvent.setup();
      render(<FeedbackModal open onClose={onClose} />);
      await user.type(
        screen.getByPlaceholderText('modal.placeholder'),
        'This is a valid feedback comment.',
      );
      expect(screen.queryByText('errors.tooShort')).not.toBeInTheDocument();
    });
  });

  describe('submission', () => {
    it('calls apiClient.post with trimmed comment and context', async () => {
      const user = userEvent.setup();
      mocks.mockPost.mockResolvedValue({ data: { issueUrl: 'https://github.com/issues/1' } });
      render(<FeedbackModal open onClose={onClose} />);
      await user.type(
        screen.getByPlaceholderText('modal.placeholder'),
        '  This is a valid comment.  ',
      );
      await user.click(screen.getByRole('button', { name: 'modal.submit' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith(
          '/v1/feedback',
          expect.objectContaining({
            comment: 'This is a valid comment.',
            currentPage: expect.any(String),
            userAgent: expect.any(String),
            viewportSize: expect.any(String),
            language: expect.any(String),
            theme: expect.stringMatching(/^(dark|light)$/),
          }),
        ),
      );
    });

    it('shows success toast and calls onClose after successful submission', async () => {
      const user = userEvent.setup();
      mocks.mockPost.mockResolvedValue({ data: { issueUrl: 'https://github.com/issues/1' } });
      render(<FeedbackModal open onClose={onClose} />);
      await user.type(
        screen.getByPlaceholderText('modal.placeholder'),
        'This is a valid feedback comment.',
      );
      await user.click(screen.getByRole('button', { name: 'modal.submit' }));
      await waitFor(() => {
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('success');
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows rateLimitExceeded error on 429', async () => {
      const user = userEvent.setup();
      mocks.mockIsAxiosError.mockReturnValue(true);
      mocks.mockPost.mockRejectedValue(makeAxiosError(429));
      render(<FeedbackModal open onClose={onClose} />);
      await user.type(
        screen.getByPlaceholderText('modal.placeholder'),
        'This is a valid feedback comment.',
      );
      await user.click(screen.getByRole('button', { name: 'modal.submit' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('errors.rateLimitExceeded'),
      );
      expect(onClose).not.toHaveBeenCalled();
    });

    it('shows submitFailed error on non-429 failures', async () => {
      const user = userEvent.setup();
      mocks.mockPost.mockRejectedValue(new Error('Network error'));
      render(<FeedbackModal open onClose={onClose} />);
      await user.type(
        screen.getByPlaceholderText('modal.placeholder'),
        'This is a valid feedback comment.',
      );
      await user.click(screen.getByRole('button', { name: 'modal.submit' }));
      await waitFor(() => expect(mocks.mockToastError).toHaveBeenCalledWith('errors.submitFailed'));
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});

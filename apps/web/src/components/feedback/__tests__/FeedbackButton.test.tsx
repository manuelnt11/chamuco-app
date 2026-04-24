import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockFeedbackModal: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/feedback/FeedbackModal', () => ({
  FeedbackModal: mocks.mockFeedbackModal,
}));

vi.mock('@phosphor-icons/react', () => ({
  ChatCircleIcon: () => <span data-testid="chat-icon" />,
}));

import { FeedbackButton } from '@/components/feedback/FeedbackButton';

describe('FeedbackButton', () => {
  beforeEach(() => {
    mocks.mockFeedbackModal.mockImplementation(
      ({ open }: { open: boolean; onClose: () => void }) =>
        open ? <div data-testid="feedback-modal" /> : null,
    );
    vi.clearAllMocks();
  });

  it('renders the floating button', () => {
    render(<FeedbackButton />);
    expect(screen.getByRole('button', { name: 'button.label' })).toBeInTheDocument();
  });

  it('renders chat icon inside button', () => {
    render(<FeedbackButton />);
    expect(screen.getByTestId('chat-icon')).toBeInTheDocument();
  });

  it('modal is closed initially', () => {
    render(<FeedbackButton />);
    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();
  });

  it('opens modal when button is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);
    await user.click(screen.getByRole('button', { name: 'button.label' }));
    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
  });

  it('modal closes when onClose is called', async () => {
    const user = userEvent.setup();
    mocks.mockFeedbackModal.mockImplementation(
      ({ open, onClose }: { open: boolean; onClose: () => void }) =>
        open ? (
          <div data-testid="feedback-modal">
            <button onClick={onClose}>Close</button>
          </div>
        ) : null,
    );

    render(<FeedbackButton />);
    await user.click(screen.getByRole('button', { name: 'button.label' }));
    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();
  });
});

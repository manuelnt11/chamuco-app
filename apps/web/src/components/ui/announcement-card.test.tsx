import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnnouncementCard } from './announcement-card';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/components/ui/markdown-content', () => ({
  MarkdownContent: ({ content }: { content: string }) => <span>{content}</span>,
}));

const defaultProps = {
  content: 'Hello **world**',
  postedByLabel: 'Posted by @alice',
  createdAt: '2026-01-15T10:00:00.000Z',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AnnouncementCard', () => {
  it('renders content and posted-by label', () => {
    render(<AnnouncementCard {...defaultProps} />);
    expect(screen.getByText('Hello **world**')).toBeInTheDocument();
    expect(screen.getByText(/Posted by @alice/)).toBeInTheDocument();
  });

  it('does not show see-more button when content fits', () => {
    render(<AnnouncementCard {...defaultProps} />);
    expect(screen.queryByText('actions.viewMore')).not.toBeInTheDocument();
  });

  it('shows see-more button when content overflows', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(60);
    render(<AnnouncementCard {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('actions.viewMore')).toBeInTheDocument();
    });
  });

  it('toggles to viewLess after clicking viewMore', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(60);
    render(<AnnouncementCard {...defaultProps} />);
    await waitFor(() => screen.getByText('actions.viewMore'));
    fireEvent.click(screen.getByText('actions.viewMore'));
    expect(screen.getByText('actions.viewLess')).toBeInTheDocument();
  });

  it('toggles back to viewMore after clicking viewLess', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(60);
    render(<AnnouncementCard {...defaultProps} />);
    await waitFor(() => screen.getByText('actions.viewMore'));
    fireEvent.click(screen.getByText('actions.viewMore'));
    fireEvent.click(screen.getByText('actions.viewLess'));
    expect(screen.getByText('actions.viewMore')).toBeInTheDocument();
  });

  it('applies line-clamp class when collapsed', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(60);
    render(<AnnouncementCard {...defaultProps} collapsedLines={4} />);
    await waitFor(() => screen.getByText('actions.viewMore'));
    const contentWrapper = screen.getByText('Hello **world**').closest('div');
    expect(contentWrapper?.className).toContain('line-clamp-4');
  });

  it('removes line-clamp class when expanded', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(60);
    render(<AnnouncementCard {...defaultProps} />);
    await waitFor(() => screen.getByText('actions.viewMore'));
    fireEvent.click(screen.getByText('actions.viewMore'));
    const contentWrapper = screen.getByText('Hello **world**').closest('div');
    expect(contentWrapper?.className ?? '').not.toContain('line-clamp');
  });

  describe('noCollapse', () => {
    it('never shows view-more button even when content overflows', async () => {
      vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(60);
      render(<AnnouncementCard {...defaultProps} noCollapse />);
      await waitFor(() => {});
      expect(screen.queryByText('actions.viewMore')).not.toBeInTheDocument();
    });

    it('applies no line-clamp class', async () => {
      render(<AnnouncementCard {...defaultProps} noCollapse />);
      const contentWrapper = screen.getByText('Hello **world**').closest('div');
      expect(contentWrapper?.className ?? '').not.toContain('line-clamp');
    });
  });
});

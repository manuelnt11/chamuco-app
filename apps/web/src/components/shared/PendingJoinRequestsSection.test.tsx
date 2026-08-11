import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { PendingJoinRequestsSection } from './PendingJoinRequestsSection';

interface Item {
  id: string;
  name: string;
  coverUrl: string | null;
  initiatedAt: string;
}

const itemA: Item = {
  id: 'a',
  name: 'Mountain Crew',
  coverUrl: 'https://cdn.example.com/cover.jpg',
  initiatedAt: '2026-01-15T00:00:00.000Z',
};

function renderSection(
  overrides: Partial<ComponentProps<typeof PendingJoinRequestsSection<Item>>> = {},
) {
  const onCancel = vi.fn();
  const props = {
    headingId: 'heading-id',
    titleText: 'Pending Requests (1)',
    items: [itemA],
    getId: (item: Item) => item.id,
    getName: (item: Item) => item.name,
    getCoverUrl: (item: Item) => item.coverUrl,
    getInitiatedAt: (item: Item) => item.initiatedAt,
    getHref: (item: Item) => `/groups/${item.id}`,
    cancelLabel: 'Cancel request',
    cancelErrorLabel: 'Failed to cancel request',
    cancellingIds: new Set<string>(),
    errorIds: new Set<string>(),
    onCancel,
    locale: 'en',
    ...overrides,
  };
  const result = render(<PendingJoinRequestsSection {...props} />);
  return { ...result, onCancel };
}

describe('PendingJoinRequestsSection', () => {
  it('renders the heading text', () => {
    renderSection();
    expect(screen.getByText('Pending Requests (1)')).toBeInTheDocument();
  });

  it('renders the item name and link href', () => {
    renderSection();
    const link = screen.getByText('Mountain Crew').closest('a');
    expect(link).toHaveAttribute('href', '/groups/a');
  });

  it('renders the cover image when coverUrl is set', () => {
    const { container } = renderSection();
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/cover.jpg');
  });

  it('omits the cover image when coverUrl is null', () => {
    const { container } = renderSection({ items: [{ ...itemA, coverUrl: null }] });
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('formats the date using the provided locale', () => {
    renderSection({ locale: 'es' });
    expect(screen.getByText(/ene/)).toBeInTheDocument();
  });

  it('renders the cancel button with the given label', () => {
    renderSection();
    expect(screen.getByRole('button', { name: 'Cancel request' })).toBeInTheDocument();
  });

  it('calls onCancel with the item when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderSection();
    await user.click(screen.getByRole('button', { name: 'Cancel request' }));
    expect(onCancel).toHaveBeenCalledWith(itemA);
  });

  it('disables the cancel button when the id is in cancellingIds', () => {
    renderSection({ cancellingIds: new Set(['a']) });
    expect(screen.getByRole('button', { name: 'Cancel request' })).toBeDisabled();
  });

  it('shows the error label when the id is in errorIds', () => {
    renderSection({ errorIds: new Set(['a']) });
    expect(screen.getByText('Failed to cancel request')).toBeInTheDocument();
  });

  it('does not show the error label when the id is not in errorIds', () => {
    renderSection();
    expect(screen.queryByText('Failed to cancel request')).not.toBeInTheDocument();
  });

  it('renders multiple items independently', () => {
    const itemB: Item = { ...itemA, id: 'b', name: 'Beach Club' };
    renderSection({
      items: [itemA, itemB],
      cancellingIds: new Set(['b']),
      titleText: 'Pending Requests (2)',
    });

    expect(screen.getByText('Mountain Crew')).toBeInTheDocument();
    expect(screen.getByText('Beach Club')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Cancel request' });
    expect(buttons[0]).not.toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });
});

import { type ComponentProps, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@base-ui/react/avatar', () => ({
  Avatar: {
    Root: ({ children, ...props }: ComponentProps<'div'>) => <div {...props}>{children}</div>,
    Image: ({ src, alt }: ComponentProps<'img'>) => <img src={src} alt={alt} />,
    Fallback: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  },
}));

const mocks = vi.hoisted(() => ({
  mockUseUserSearch: vi.fn(),
}));

vi.mock('@/hooks/useUserSearch', () => ({
  useUserSearch: mocks.mockUseUserSearch,
}));

import { UserAutocomplete } from './user-autocomplete';
import type { UserSearchResult } from '@/types/user';

const mockUser: UserSearchResult = {
  id: 'user-1',
  username: 'janedoe',
  displayName: 'Jane Doe',
  avatar: null,
};

function setup(value = '', onSelect = vi.fn(), onChange = vi.fn()) {
  const user = userEvent.setup();
  render(
    <UserAutocomplete
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      placeholder="Search"
      data-testid="user-autocomplete"
    />,
  );
  return { user, onSelect, onChange };
}

beforeEach(() => {
  mocks.mockUseUserSearch.mockReturnValue({ results: [], isLoading: false });
});

describe('UserAutocomplete', () => {
  it('renders the input', () => {
    setup();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('does not show dropdown when value is empty', () => {
    setup('');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows spinner when loading', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [], isLoading: true });
    const { user } = setup('ja');
    await user.click(screen.getByRole('textbox'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows empty state when no results and query is valid', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [], isLoading: false });
    const { user } = setup('zzz');
    await user.click(screen.getByRole('textbox'));

    await waitFor(() => {
      expect(screen.getByText('members.invite.noResults')).toBeInTheDocument();
    });
  });

  it('renders result items in dropdown', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [mockUser], isLoading: false });
    const { user } = setup('jane');
    await user.click(screen.getByRole('textbox'));

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('@janedoe')).toBeInTheDocument();
    });
  });

  it('calls onSelect and onChange when item is clicked', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [mockUser], isLoading: false });
    const onSelect = vi.fn();
    const onChange = vi.fn();
    const { user } = setup('jane', onSelect, onChange);
    await user.click(screen.getByRole('textbox'));

    await waitFor(() => screen.getByText('Jane Doe'));
    await user.click(screen.getByText('Jane Doe'));

    expect(onSelect).toHaveBeenCalledWith(mockUser);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('closes dropdown on Escape key', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [mockUser], isLoading: false });
    const { user } = setup('jane');
    const input = screen.getByRole('textbox');
    await user.click(input);

    await waitFor(() => screen.getByText('Jane Doe'));
    await user.keyboard('{Escape}');

    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  it('selects item with keyboard Enter after ArrowDown', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [mockUser], isLoading: false });
    const onSelect = vi.fn();
    const onChange = vi.fn();
    const { user } = setup('jane', onSelect, onChange);
    const input = screen.getByRole('textbox');
    await user.click(input);

    await waitFor(() => screen.getByText('Jane Doe'));
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledWith(mockUser);
  });

  it('does not show dropdown when query is just @', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [], isLoading: false });
    const { user } = setup('@');
    await user.click(screen.getByRole('textbox'));
    expect(screen.queryByText('members.invite.noResults')).not.toBeInTheDocument();
  });
});

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

function setup(props: Partial<Parameters<typeof UserAutocomplete>[0]> = {}) {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  const onChange = vi.fn();
  render(
    <UserAutocomplete
      value=""
      onChange={onChange}
      onSelect={onSelect}
      placeholder="Search"
      data-testid="user-autocomplete"
      {...props}
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
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('does not show dropdown when value is empty', () => {
    setup({ value: '' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows spinner when loading', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [], isLoading: true });
    const { user } = setup({ value: 'ja' });
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no results and query is valid', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [], isLoading: false });
    const { user } = setup({ value: 'zzz' });
    await user.click(screen.getByRole('combobox'));

    await waitFor(() => {
      expect(screen.getByText('members.invite.noResults')).toBeInTheDocument();
    });
  });

  it('renders result items in dropdown', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [mockUser], isLoading: false });
    const { user } = setup({ value: 'jane' });
    await user.click(screen.getByRole('combobox'));

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('@janedoe')).toBeInTheDocument();
    });
  });

  it('calls onSelect and onChange when item is clicked', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [mockUser], isLoading: false });
    const { user, onSelect, onChange } = setup({ value: 'jane' });
    await user.click(screen.getByRole('combobox'));

    await waitFor(() => screen.getByText('Jane Doe'));
    await user.click(screen.getByText('Jane Doe'));

    expect(onSelect).toHaveBeenCalledWith(mockUser);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('closes dropdown on Escape key', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [mockUser], isLoading: false });
    const { user } = setup({ value: 'jane' });
    const input = screen.getByRole('combobox');
    await user.click(input);

    await waitFor(() => screen.getByText('Jane Doe'));
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument());
  });

  it('selects item with keyboard Enter after ArrowDown', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [mockUser], isLoading: false });
    const { user, onSelect } = setup({ value: 'jane' });
    const input = screen.getByRole('combobox');
    await user.click(input);

    await waitFor(() => screen.getByText('Jane Doe'));
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledWith(mockUser);
  });

  it('does not show dropdown when query is just @', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [], isLoading: false });
    const { user } = setup({ value: '@' });
    await user.click(screen.getByRole('combobox'));
    expect(screen.queryByText('members.invite.noResults')).not.toBeInTheDocument();
  });

  it('disables the input when disabled is true', () => {
    setup({ disabled: true });
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('hides the dropdown when disabled flips to true while open', async () => {
    mocks.mockUseUserSearch.mockReturnValue({ results: [mockUser], isLoading: false });
    const user = userEvent.setup();
    const { rerender } = render(
      <UserAutocomplete value="jane" onChange={vi.fn()} onSelect={vi.fn()} />,
    );
    await user.click(screen.getByRole('combobox'));
    await waitFor(() => screen.getByText('Jane Doe'));

    rerender(<UserAutocomplete value="jane" onChange={vi.fn()} onSelect={vi.fn()} disabled />);
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });
});

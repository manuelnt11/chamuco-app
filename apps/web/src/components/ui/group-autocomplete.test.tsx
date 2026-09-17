import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockUseGroupPickerSearch: vi.fn(),
}));

vi.mock('@/hooks/useGroupPickerSearch', () => ({
  useGroupPickerSearch: mocks.mockUseGroupPickerSearch,
}));

import { GroupAutocomplete } from './group-autocomplete';
import type { Group, GroupSearchResult } from '@/types/group';
import { GroupVisibility, MembershipStatus } from '@chamuco/shared-types';

const myGroup: Group = {
  id: 'group-1',
  name: 'Mountain Crew',
  description: null,
  coverUrl: 'https://cdn/emoji.svg',
  visibility: GroupVisibility.PUBLIC,
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const publicGroup: GroupSearchResult = {
  ...myGroup,
  id: 'group-2',
  name: 'Beach Explorers',
  memberCount: 5,
  membershipStatus: 'none' as MembershipStatus,
};

function setup(props: Partial<Parameters<typeof GroupAutocomplete>[0]> = {}) {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  const onChange = vi.fn();
  render(
    <GroupAutocomplete
      value=""
      onChange={onChange}
      onSelect={onSelect}
      placeholder="Search groups"
      data-testid="group-autocomplete"
      {...props}
    />,
  );
  return { user, onSelect, onChange };
}

beforeEach(() => {
  mocks.mockUseGroupPickerSearch.mockReturnValue({
    myGroups: [],
    publicGroups: [],
    isLoading: false,
  });
});

describe('GroupAutocomplete', () => {
  it('renders input', () => {
    setup();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('does not show dropdown when value is empty', () => {
    setup({ value: '' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows spinner when loading', async () => {
    mocks.mockUseGroupPickerSearch.mockReturnValue({
      myGroups: [],
      publicGroups: [],
      isLoading: true,
    });
    const { user } = setup({ value: 'mountain' });
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no results', async () => {
    const { user } = setup({ value: 'zzz' });
    await user.click(screen.getByRole('combobox'));
    await waitFor(() => {
      expect(screen.getByText('form.linkedGroupsNoResults')).toBeInTheDocument();
    });
  });

  it('shows my groups section when there are own groups', async () => {
    mocks.mockUseGroupPickerSearch.mockReturnValue({
      myGroups: [myGroup],
      publicGroups: [],
      isLoading: false,
    });
    const { user } = setup({ value: 'mountain' });
    await user.click(screen.getByRole('combobox'));
    await waitFor(() => {
      expect(screen.getByText('form.linkedGroupsMyGroups')).toBeInTheDocument();
      expect(screen.getByText('Mountain Crew')).toBeInTheDocument();
    });
  });

  it('shows public groups section when there are public groups', async () => {
    mocks.mockUseGroupPickerSearch.mockReturnValue({
      myGroups: [],
      publicGroups: [publicGroup],
      isLoading: false,
    });
    const { user } = setup({ value: 'beach' });
    await user.click(screen.getByRole('combobox'));
    await waitFor(() => {
      expect(screen.getByText('form.linkedGroupsPublicGroups')).toBeInTheDocument();
      expect(screen.getByText('Beach Explorers')).toBeInTheDocument();
    });
  });

  it('calls onSelect with the group and isMyGroup flag when a my-group item is clicked', async () => {
    mocks.mockUseGroupPickerSearch.mockReturnValue({
      myGroups: [myGroup],
      publicGroups: [],
      isLoading: false,
    });
    const { user, onSelect } = setup({ value: 'mountain' });
    await user.click(screen.getByRole('combobox'));

    await waitFor(() => {
      expect(screen.getByText('Mountain Crew')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Mountain Crew'));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'group-1', isMyGroup: true }),
    );
  });

  it('excludes already-selected groups', async () => {
    mocks.mockUseGroupPickerSearch.mockReturnValue({
      myGroups: [myGroup],
      publicGroups: [],
      isLoading: false,
    });
    const { user } = setup({ value: 'mountain', excludedIds: ['group-1'] });
    await user.click(screen.getByRole('combobox'));
    await waitFor(() => {
      expect(screen.queryByText('Mountain Crew')).not.toBeInTheDocument();
    });
  });

  it('closes dropdown on Escape key', async () => {
    mocks.mockUseGroupPickerSearch.mockReturnValue({
      myGroups: [myGroup],
      publicGroups: [],
      isLoading: false,
    });
    const { user } = setup({ value: 'mountain' });
    const input = screen.getByRole('combobox');
    await user.click(input);

    await waitFor(() => screen.getByText('Mountain Crew'));
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByText('Mountain Crew')).not.toBeInTheDocument());
  });

  it('selects item with keyboard Enter after ArrowDown', async () => {
    mocks.mockUseGroupPickerSearch.mockReturnValue({
      myGroups: [myGroup],
      publicGroups: [],
      isLoading: false,
    });
    const { user, onSelect } = setup({ value: 'mountain' });
    const input = screen.getByRole('combobox');
    await user.click(input);

    await waitFor(() => screen.getByText('Mountain Crew'));
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'group-1', isMyGroup: true }),
    );
  });

  it('disables the input when disabled is true', () => {
    setup({ disabled: true });
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('hides the dropdown when disabled flips to true while open', async () => {
    mocks.mockUseGroupPickerSearch.mockReturnValue({
      myGroups: [myGroup],
      publicGroups: [],
      isLoading: false,
    });
    const user = userEvent.setup();
    const { rerender } = render(
      <GroupAutocomplete value="mountain" onChange={vi.fn()} onSelect={vi.fn()} />,
    );
    await user.click(screen.getByRole('combobox'));
    await waitFor(() => screen.getByText('Mountain Crew'));

    rerender(<GroupAutocomplete value="mountain" onChange={vi.fn()} onSelect={vi.fn()} disabled />);
    expect(screen.queryByText('Mountain Crew')).not.toBeInTheDocument();
  });
});

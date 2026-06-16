import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockUseGroupPickerSearch: vi.fn(),
}));

vi.mock('@/hooks/useGroupPickerSearch', () => ({
  useGroupPickerSearch: mocks.mockUseGroupPickerSearch,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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

function setup(value = '', onSelect = vi.fn(), onChange = vi.fn()) {
  const user = userEvent.setup();
  render(
    <GroupAutocomplete
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      placeholder="Search groups"
      data-testid="group-autocomplete"
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
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('does not show dropdown when value is empty', () => {
    setup('');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows spinner when loading', async () => {
    mocks.mockUseGroupPickerSearch.mockReturnValue({
      myGroups: [],
      publicGroups: [],
      isLoading: true,
    });
    const { user } = setup('mountain');
    await user.click(screen.getByRole('textbox'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows empty state when no results', async () => {
    const { user } = setup('zzz');
    await user.click(screen.getByRole('textbox'));
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
    const { user } = setup('mountain');
    await user.click(screen.getByRole('textbox'));
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
    const { user } = setup('beach');
    await user.click(screen.getByRole('textbox'));
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
    const onSelect = vi.fn();
    const { user } = setup('mountain', onSelect);
    await user.click(screen.getByRole('textbox'));

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
    const { user } = setup('mountain');
    render(
      <GroupAutocomplete
        value="mountain"
        onChange={vi.fn()}
        onSelect={vi.fn()}
        excludedIds={['group-1']}
        placeholder="Search"
      />,
    );
    const inputs = screen.getAllByRole('textbox');
    await user.click(inputs[inputs.length - 1]!);
    await waitFor(() => {
      expect(screen.queryByText('Mountain Crew')).not.toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PassportStatus } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    post: mocks.mockPost,
    patch: mocks.mockPatch,
    delete: mocks.mockDelete,
  },
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    success: mocks.mockToastSuccess,
    error: mocks.mockToastError,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('countries-list', () => ({
  getCountryDataList: () => [
    { iso2: 'CO', name: 'Colombia', phone: [57] },
    { iso2: 'US', name: 'United States', phone: [1] },
    { iso2: 'MX', name: 'Mexico', phone: [52] },
  ],
  getEmojiFlag: (iso2: string) => `[${iso2}]`,
}));

vi.mock('@/components/ui/country-combobox', () => ({
  CountryCombobox: ({
    value,
    onChange,
    'data-testid': testId,
  }: {
    value: string;
    onChange: (iso: string) => void;
    'data-testid'?: string;
  }) => (
    <select
      data-testid={testId ?? 'country-combobox'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select country</option>
      <option value="CO">Colombia</option>
      <option value="US">United States</option>
      <option value="MX">Mexico</option>
    </select>
  ),
}));

vi.mock('./VisasSubsection', () => ({
  VisasSubsection: ({ nationalityId }: { nationalityId: string }) => (
    <div data-testid={`visas-${nationalityId}`}>Visas subsection</div>
  ),
}));

vi.mock('./EtasSubsection', () => ({
  EtasSubsection: ({ nationalityId }: { nationalityId: string; passportNumber: string | null }) => (
    <div data-testid={`etas-${nationalityId}`}>ETAs subsection</div>
  ),
}));

import { NationalitiesSection } from './NationalitiesSection';
import type { NationalityDto } from './NationalitiesSection';

const sampleNationalities: NationalityDto[] = [
  {
    id: 'nat-1',
    countryCode: 'CO',
    isPrimary: true,
    nationalIdNumber: '1234567890',
    passportNumber: 'AB123456',
    passportIssueDate: '2020-01-15',
    passportExpiryDate: '2030-01-15',
    passportStatus: PassportStatus.ACTIVE,
  },
  {
    id: 'nat-2',
    countryCode: 'US',
    isPrimary: false,
    nationalIdNumber: null,
    passportNumber: null,
    passportIssueDate: null,
    passportExpiryDate: null,
    passportStatus: PassportStatus.OMITTED,
  },
];

function setup(nationalities: NationalityDto[] = sampleNationalities) {
  const onRefresh = vi.fn();
  const user = userEvent.setup();
  render(<NationalitiesSection data={nationalities} onRefresh={onRefresh} />);
  return { user, onRefresh };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockPost.mockResolvedValue({});
  mocks.mockPatch.mockResolvedValue({});
  mocks.mockDelete.mockResolvedValue({});
});

describe('NationalitiesSection', () => {
  describe('rendering', () => {
    it('renders the section heading', () => {
      setup();
      expect(screen.getByText('nationalities.heading')).toBeInTheDocument();
    });

    it('renders existing nationalities', () => {
      setup();
      expect(screen.getByText('Colombia')).toBeInTheDocument();
      expect(screen.getByText('United States')).toBeInTheDocument();
    });

    it('renders national ID when present', () => {
      setup();
      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });

    it('renders passport number when present', () => {
      setup();
      expect(screen.getByText('AB123456')).toBeInTheDocument();
    });

    it('renders passport expiry date alongside passport number', () => {
      setup();
      expect(screen.getByText('· 2030-01-15')).toBeInTheDocument();
    });

    it('does not render passport number for nationality with null passportNumber', () => {
      const data: NationalityDto[] = [{ ...sampleNationalities[1]! }]; // US, passportNumber: null
      setup(data);
      expect(screen.queryByText('AB123456')).not.toBeInTheDocument();
    });

    it('renders primary badge on primary nationality', () => {
      setup();
      expect(screen.getByText('nationalities.primaryBadge')).toBeInTheDocument();
    });

    it('renders only one primary badge', () => {
      setup();
      const badges = screen.getAllByText('nationalities.primaryBadge');
      expect(badges).toHaveLength(1);
    });

    it('renders passport status badge for each entry', () => {
      setup();
      expect(screen.getByText('nationalities.passportStatus.ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('nationalities.passportStatus.OMITTED')).toBeInTheDocument();
    });

    it('renders EXPIRING_SOON status badge', () => {
      const data: NationalityDto[] = [
        { ...sampleNationalities[0]!, passportStatus: PassportStatus.EXPIRING_SOON },
      ];
      setup(data);
      expect(screen.getByText('nationalities.passportStatus.EXPIRING_SOON')).toBeInTheDocument();
    });

    it('renders EXPIRED status badge', () => {
      const data: NationalityDto[] = [
        { ...sampleNationalities[0]!, passportStatus: PassportStatus.EXPIRED },
      ];
      setup(data);
      expect(screen.getByText('nationalities.passportStatus.EXPIRED')).toBeInTheDocument();
    });

    it('renders empty state when no nationalities', () => {
      setup([]);
      expect(screen.getByText('nationalities.empty')).toBeInTheDocument();
    });

    it('renders Add button', () => {
      setup();
      expect(screen.getByRole('button', { name: 'nationalities.add' })).toBeInTheDocument();
    });
  });

  describe('adding a nationality', () => {
    it('shows add form when Add button is clicked', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      expect(screen.getByLabelText('nationalities.nationalIdNumber')).toBeInTheDocument();
    });

    it('hides Add button while add form is open', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      expect(screen.queryByRole('button', { name: 'nationalities.add' })).not.toBeInTheDocument();
    });

    it('calls POST with correct payload on submit', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.type(screen.getByLabelText('nationalities.nationalIdNumber'), '9876543210');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith('/v1/users/me/nationalities', {
          countryCode: 'CO',
          nationalIdNumber: '9876543210',
          passportNumber: null,
          passportIssueDate: null,
          passportExpiryDate: null,
          isPrimary: true,
        }),
      );
    });

    it('calls POST with passport fields when all three provided', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.type(screen.getByLabelText('nationalities.passportNumber'), 'AB123456');
      await user.type(screen.getByLabelText('nationalities.passportExpiryDate'), '2030-01-15');
      await user.type(screen.getByLabelText('nationalities.passportIssueDate'), '2020-01-15');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith(
          '/v1/users/me/nationalities',
          expect.objectContaining({
            passportNumber: 'AB123456',
            passportIssueDate: '2020-01-15',
            passportExpiryDate: '2030-01-15',
          }),
        ),
      );
    });

    it('auto-fills expiry date to issue date + 10 years when expiry is empty', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.type(screen.getByLabelText('nationalities.passportIssueDate'), '2020-01-15');
      expect(screen.getByLabelText('nationalities.passportExpiryDate')).toHaveValue('2030-01-15');
    });

    it('does not overwrite expiry date when already set', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.type(screen.getByLabelText('nationalities.passportExpiryDate'), '2025-06-01');
      await user.type(screen.getByLabelText('nationalities.passportIssueDate'), '2020-01-15');
      expect(screen.getByLabelText('nationalities.passportExpiryDate')).toHaveValue('2025-06-01');
    });

    it('defaults isPrimary to true when list is empty', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      expect(screen.getByRole('checkbox', { name: 'nationalities.primaryBadge' })).toBeChecked();
    });

    it('defaults isPrimary to false when list is non-empty', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      expect(
        screen.getByRole('checkbox', { name: 'nationalities.primaryBadge' }),
      ).not.toBeChecked();
    });

    it('calls onRefresh after adding', async () => {
      const { user, onRefresh } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });

    it('shows success toast on add', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('nationalities.addSuccess'),
      );
    });

    it('hides add form after successful add', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() =>
        expect(screen.queryByLabelText('nationalities.nationalIdNumber')).not.toBeInTheDocument(),
      );
    });

    it('cancels add form when Cancel is clicked', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.click(screen.getByRole('button', { name: 'nationalities.cancel' }));
      expect(screen.queryByLabelText('nationalities.nationalIdNumber')).not.toBeInTheDocument();
    });

    it('shows error toast when add fails', async () => {
      mocks.mockPost.mockRejectedValue(new Error('network error'));
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('nationalities.saveError'),
      );
    });
  });

  describe('form validation', () => {
    it('shows nationalIdFormat error when national ID has spaces', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.type(screen.getByLabelText('nationalities.nationalIdNumber'), 'AB 123');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      expect(screen.getByText('nationalities.errors.nationalIdFormat')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('auto-uppercases national ID input', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.type(screen.getByLabelText('nationalities.nationalIdNumber'), 'ab-123');
      expect(screen.getByLabelText('nationalities.nationalIdNumber')).toHaveValue('AB-123');
    });

    it('accepts national ID with hyphens', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.type(screen.getByLabelText('nationalities.nationalIdNumber'), 'AB-123');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() => expect(mocks.mockPost).toHaveBeenCalledOnce());
    });

    it('disables save button when no country selected in add form', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      expect(screen.getByRole('button', { name: 'nationalities.save' })).toBeDisabled();
    });

    it('shows passportIncomplete error when only passport number provided', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.type(screen.getByLabelText('nationalities.passportNumber'), 'AB123456');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      expect(screen.getByText('nationalities.errors.passportIncomplete')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('shows passportIncomplete error when only issue date provided', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.type(screen.getByLabelText('nationalities.passportIssueDate'), '2020-01-15');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      expect(screen.getByText('nationalities.errors.passportIncomplete')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('shows expiryBeforeIssue error when expiry <= issue date', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.type(screen.getByLabelText('nationalities.passportNumber'), 'AB123456');
      await user.type(screen.getByLabelText('nationalities.passportExpiryDate'), '2020-01-01');
      await user.type(screen.getByLabelText('nationalities.passportIssueDate'), '2020-06-01');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      expect(screen.getByText('nationalities.errors.expiryBeforeIssue')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('auto-uppercases passport number input', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.type(screen.getByLabelText('nationalities.passportNumber'), 'ab-123456');
      expect(screen.getByLabelText('nationalities.passportNumber')).toHaveValue('AB-123456');
    });

    it('shows passportFormat error when passport number has spaces', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.type(screen.getByLabelText('nationalities.passportNumber'), 'AB 123456');
      await user.type(screen.getByLabelText('nationalities.passportExpiryDate'), '2030-01-15');
      await user.type(screen.getByLabelText('nationalities.passportIssueDate'), '2020-01-15');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      expect(screen.getByText('nationalities.errors.passportFormat')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('accepts passport number with hyphens', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.type(screen.getByLabelText('nationalities.passportNumber'), 'AB-123456');
      await user.type(screen.getByLabelText('nationalities.passportExpiryDate'), '2030-01-15');
      await user.type(screen.getByLabelText('nationalities.passportIssueDate'), '2020-01-15');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith(
          '/v1/users/me/nationalities',
          expect.objectContaining({ passportNumber: 'AB-123456' }),
        ),
      );
    });

    it('accepts nationality with no passport fields', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'nationalities.add' }));
      await user.selectOptions(screen.getByTestId('add-country'), 'CO');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() => expect(mocks.mockPost).toHaveBeenCalledOnce());
    });
  });

  describe('editing a nationality', () => {
    it('shows inline edit form when Edit is clicked', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'nationalities.edit' });
      await user.click(editButtons[0]!);
      expect(screen.getByLabelText('nationalities.nationalIdNumber')).toBeInTheDocument();
    });

    it('shows country as read-only text, not a combobox, in edit mode', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'nationalities.edit' });
      await user.click(editButtons[0]!);
      expect(screen.queryByTestId('edit-nat-1-country')).not.toBeInTheDocument();
      expect(screen.getByText('Colombia')).toBeInTheDocument();
    });

    it('pre-fills edit form with existing values', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'nationalities.edit' });
      await user.click(editButtons[0]!);
      expect(screen.getByLabelText('nationalities.nationalIdNumber')).toHaveValue('1234567890');
      expect(screen.getByLabelText('nationalities.passportNumber')).toHaveValue('AB123456');
      expect(screen.getByRole('checkbox', { name: 'nationalities.primaryBadge' })).toBeChecked();
    });

    it('calls PATCH on save', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'nationalities.edit' });
      await user.click(editButtons[0]!);
      const idInput = screen.getByLabelText('nationalities.nationalIdNumber');
      await user.clear(idInput);
      await user.type(idInput, '0000000000');
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/nationalities/nat-1', {
          nationalIdNumber: '0000000000',
          passportNumber: 'AB123456',
          passportIssueDate: '2020-01-15',
          passportExpiryDate: '2030-01-15',
          isPrimary: true,
        }),
      );
    });

    it('shows success toast after update', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'nationalities.edit' });
      await user.click(editButtons[0]!);
      await user.click(screen.getByRole('checkbox', { name: 'nationalities.primaryBadge' }));
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('nationalities.updateSuccess'),
      );
    });

    it('calls onRefresh after update', async () => {
      const { user, onRefresh } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'nationalities.edit' });
      await user.click(editButtons[0]!);
      await user.click(screen.getByRole('checkbox', { name: 'nationalities.primaryBadge' }));
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });

    it('cancels edit form when Cancel is clicked', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'nationalities.edit' });
      await user.click(editButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.cancel' }));
      expect(screen.queryByLabelText('nationalities.nationalIdNumber')).not.toBeInTheDocument();
    });

    it('shows error toast when update fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('network error'));
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'nationalities.edit' });
      await user.click(editButtons[0]!);
      await user.click(screen.getByRole('checkbox', { name: 'nationalities.primaryBadge' }));
      await user.click(screen.getByRole('button', { name: 'nationalities.save' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('nationalities.saveError'),
      );
    });
  });

  describe('deleting a nationality', () => {
    it('requires a second click to confirm delete', async () => {
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', { name: 'nationalities.delete' });
      await user.click(deleteButtons[0]!);
      expect(mocks.mockDelete).not.toHaveBeenCalled();
      expect(
        screen.getByRole('button', { name: 'nationalities.deleteConfirm' }),
      ).toBeInTheDocument();
    });

    it('calls DELETE after confirmation click', async () => {
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', { name: 'nationalities.delete' });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockDelete).toHaveBeenCalledWith('/v1/users/me/nationalities/nat-1'),
      );
    });

    it('calls onRefresh after delete', async () => {
      const { user, onRefresh } = setup();
      const deleteButtons = screen.getAllByRole('button', { name: 'nationalities.delete' });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.deleteConfirm' }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });

    it('shows success toast after delete', async () => {
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', { name: 'nationalities.delete' });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('nationalities.deleteSuccess'),
      );
    });

    it('shows deletePrimaryError toast on 400 response', async () => {
      const error = { response: { status: 400 } };
      mocks.mockDelete.mockRejectedValue(error);
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', { name: 'nationalities.delete' });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('nationalities.deletePrimaryError'),
      );
    });

    it('shows generic deleteError toast on non-400 error', async () => {
      mocks.mockDelete.mockRejectedValue(new Error('network error'));
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', { name: 'nationalities.delete' });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('nationalities.deleteError'),
      );
    });
  });

  describe('accordion expand/collapse', () => {
    it('renders a toggle button only for nationalities with non-OMITTED passport', () => {
      setup();
      // nat-1 is ACTIVE, nat-2 is OMITTED — only nat-1 gets a toggle
      const toggleButtons = screen.getAllByRole('button', {
        name: 'nationalities.documentsToggle',
      });
      expect(toggleButtons).toHaveLength(1);
    });

    it('hides toggle for nationality with OMITTED passport status', () => {
      setup();
      // nat-2 (US) has OMITTED passport — its toggle must not be rendered
      const toggleButtons = screen.getAllByRole('button', {
        name: 'nationalities.documentsToggle',
      });
      expect(toggleButtons).toHaveLength(1);
      expect(screen.queryByTestId('visas-nat-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('etas-nat-2')).not.toBeInTheDocument();
    });

    it('documents panel is hidden by default', () => {
      setup();
      expect(screen.queryByTestId('visas-nat-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('etas-nat-1')).not.toBeInTheDocument();
    });

    it('expands documents panel when toggle clicked', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'nationalities.documentsToggle' }));
      expect(screen.getByTestId('visas-nat-1')).toBeInTheDocument();
      expect(screen.getByTestId('etas-nat-1')).toBeInTheDocument();
    });

    it('collapses panel when toggle clicked again', async () => {
      const { user } = setup();
      const toggle = screen.getByRole('button', { name: 'nationalities.documentsToggle' });
      await user.click(toggle);
      await user.click(toggle);
      expect(screen.queryByTestId('visas-nat-1')).not.toBeInTheDocument();
    });

    it('accordion: opening second collapses first (both with passports)', async () => {
      const twoWithPassports: NationalityDto[] = [
        sampleNationalities[0]!,
        {
          ...sampleNationalities[1]!,
          passportNumber: 'XY987654',
          passportIssueDate: '2021-01-01',
          passportExpiryDate: '2031-01-01',
          passportStatus: PassportStatus.ACTIVE,
        },
      ];
      const { user } = setup(twoWithPassports);
      const toggleButtons = screen.getAllByRole('button', {
        name: 'nationalities.documentsToggle',
      });
      await user.click(toggleButtons[0]!);
      expect(screen.getByTestId('visas-nat-1')).toBeInTheDocument();
      await user.click(toggleButtons[1]!);
      expect(screen.queryByTestId('visas-nat-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('visas-nat-2')).toBeInTheDocument();
    });

    it('collapses expanded panel when entering edit mode', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'nationalities.documentsToggle' }));
      expect(screen.getByTestId('visas-nat-1')).toBeInTheDocument();
      const editButtons = screen.getAllByRole('button', { name: 'nationalities.edit' });
      await user.click(editButtons[0]!);
      expect(screen.queryByTestId('visas-nat-1')).not.toBeInTheDocument();
    });
  });
});

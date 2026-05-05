import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DocumentStatus,
  VisaCoverageType,
  VisaEntries,
  VisaType,
  VisaZone,
} from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: mocks.mockGet,
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
  getEmojiFlag: (iso2: string) => `[${iso2}]`,
}));

vi.mock('@/components/ui/country-combobox', () => ({
  CountryCombobox: ({ value, onChange }: { value: string; onChange: (iso: string) => void }) => (
    <select data-testid="country-combobox" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select country</option>
      <option value="US">United States</option>
      <option value="CA">Canada</option>
    </select>
  ),
}));

import { VisasSubsection } from './VisasSubsection';
import type { VisaDto } from './VisasSubsection';

const NATIONALITY_ID = 'nat-1';

const sampleVisas: VisaDto[] = [
  {
    id: 'visa-1',
    nationalityId: NATIONALITY_ID,
    coverageType: VisaCoverageType.COUNTRY,
    countryCode: 'US',
    visaZone: null,
    visaType: VisaType.TOURIST,
    entries: VisaEntries.MULTIPLE,
    expiryDate: '2027-12-31',
    visaStatus: DocumentStatus.ACTIVE,
    notes: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'visa-2',
    nationalityId: NATIONALITY_ID,
    coverageType: VisaCoverageType.ZONE,
    countryCode: null,
    visaZone: VisaZone.SCHENGEN,
    visaType: VisaType.BUSINESS,
    entries: VisaEntries.SINGLE,
    expiryDate: '2022-06-30',
    visaStatus: DocumentStatus.EXPIRED,
    notes: 'Old visa note',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

function setup() {
  const user = userEvent.setup();
  render(<VisasSubsection nationalityId={NATIONALITY_ID} />);
  return { user };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockGet.mockResolvedValue({ data: sampleVisas });
  mocks.mockPost.mockResolvedValue({});
  mocks.mockPatch.mockResolvedValue({});
  mocks.mockDelete.mockResolvedValue({});
});

describe('VisasSubsection', () => {
  describe('loading and rendering', () => {
    it('fetches visas on mount', async () => {
      setup();
      await waitFor(() =>
        expect(mocks.mockGet).toHaveBeenCalledWith(
          `/v1/users/me/nationalities/${NATIONALITY_ID}/visas`,
        ),
      );
    });

    it('renders heading after loading', async () => {
      setup();
      await waitFor(() =>
        expect(screen.getByText('nationalities.visas.heading')).toBeInTheDocument(),
      );
    });

    it('renders visa type labels', async () => {
      setup();
      await waitFor(() =>
        expect(screen.getByText('nationalities.visas.visaTypes.TOURIST')).toBeInTheDocument(),
      );
      expect(screen.getByText('nationalities.visas.visaTypes.BUSINESS')).toBeInTheDocument();
    });

    it('renders ACTIVE status badge', async () => {
      setup();
      await waitFor(() =>
        expect(screen.getByText('nationalities.documentStatus.ACTIVE')).toBeInTheDocument(),
      );
    });

    it('renders EXPIRED status badge', async () => {
      setup();
      await waitFor(() =>
        expect(screen.getByText('nationalities.documentStatus.EXPIRED')).toBeInTheDocument(),
      );
    });

    it('renders notes when present', async () => {
      setup();
      await waitFor(() => expect(screen.getByText('Old visa note')).toBeInTheDocument());
    });

    it('renders empty state when no visas', async () => {
      mocks.mockGet.mockResolvedValue({ data: [] });
      setup();
      await waitFor(() =>
        expect(screen.getByText('nationalities.visas.empty')).toBeInTheDocument(),
      );
    });

    it('renders Add visa button', async () => {
      setup();
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'nationalities.visas.add' })).toBeInTheDocument(),
      );
    });
  });

  describe('adding a visa', () => {
    async function openAddForm(user: ReturnType<typeof userEvent.setup>) {
      await waitFor(() => screen.getByRole('button', { name: 'nationalities.visas.add' }));
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.add' }));
    }

    it('shows add form when Add button is clicked', async () => {
      const { user } = setup();
      await openAddForm(user);
      expect(screen.getByLabelText('nationalities.visas.coverageType')).toBeInTheDocument();
    });

    it('shows country combobox when COUNTRY coverage selected', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(
        screen.getByLabelText('nationalities.visas.coverageType'),
        'COUNTRY',
      );
      expect(screen.getByTestId('country-combobox')).toBeInTheDocument();
    });

    it('shows zone select when ZONE coverage selected', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByLabelText('nationalities.visas.coverageType'), 'ZONE');
      expect(screen.getByLabelText('nationalities.visas.zone')).toBeInTheDocument();
    });

    it('hides Add button while form is open', async () => {
      const { user } = setup();
      await openAddForm(user);
      expect(
        screen.queryByRole('button', { name: 'nationalities.visas.add' }),
      ).not.toBeInTheDocument();
    });

    it('calls POST with COUNTRY visa payload', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(
        screen.getByLabelText('nationalities.visas.coverageType'),
        'COUNTRY',
      );
      await user.selectOptions(screen.getByTestId('country-combobox'), 'US');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.visaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.entries'), 'MULTIPLE');
      await user.type(screen.getByLabelText('nationalities.visas.expiryDate'), '2027-12-31');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith(
          `/v1/users/me/nationalities/${NATIONALITY_ID}/visas`,
          expect.objectContaining({
            coverageType: 'COUNTRY',
            countryCode: 'US',
            visaType: 'TOURIST',
            entries: 'MULTIPLE',
            expiryDate: '2027-12-31',
            notes: null,
          }),
        ),
      );
    });

    it('calls POST with ZONE visa payload', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByLabelText('nationalities.visas.coverageType'), 'ZONE');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.zone'), 'SCHENGEN');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.visaType'), 'BUSINESS');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.entries'), 'SINGLE');
      await user.type(screen.getByLabelText('nationalities.visas.expiryDate'), '2027-12-31');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith(
          `/v1/users/me/nationalities/${NATIONALITY_ID}/visas`,
          expect.objectContaining({
            coverageType: 'ZONE',
            visaZone: 'SCHENGEN',
            visaType: 'BUSINESS',
            entries: 'SINGLE',
          }),
        ),
      );
    });

    it('includes notes in POST when provided', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(
        screen.getByLabelText('nationalities.visas.coverageType'),
        'COUNTRY',
      );
      await user.selectOptions(screen.getByTestId('country-combobox'), 'US');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.visaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.entries'), 'SINGLE');
      await user.type(screen.getByLabelText('nationalities.visas.expiryDate'), '2027-12-31');
      await user.type(screen.getByLabelText('nationalities.visas.notes'), 'My note');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith(
          `/v1/users/me/nationalities/${NATIONALITY_ID}/visas`,
          expect.objectContaining({ notes: 'My note' }),
        ),
      );
    });

    it('shows success toast after add', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(
        screen.getByLabelText('nationalities.visas.coverageType'),
        'COUNTRY',
      );
      await user.selectOptions(screen.getByTestId('country-combobox'), 'US');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.visaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.entries'), 'MULTIPLE');
      await user.type(screen.getByLabelText('nationalities.visas.expiryDate'), '2027-12-31');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('nationalities.visas.addSuccess'),
      );
    });

    it('shows error toast when add fails', async () => {
      mocks.mockPost.mockRejectedValue(new Error('network'));
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(
        screen.getByLabelText('nationalities.visas.coverageType'),
        'COUNTRY',
      );
      await user.selectOptions(screen.getByTestId('country-combobox'), 'US');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.visaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.entries'), 'MULTIPLE');
      await user.type(screen.getByLabelText('nationalities.visas.expiryDate'), '2027-12-31');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('nationalities.visas.saveError'),
      );
    });

    it('cancels add form when Cancel clicked', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.cancel' }));
      expect(screen.queryByLabelText('nationalities.visas.coverageType')).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    async function openAddForm(user: ReturnType<typeof userEvent.setup>) {
      await waitFor(() => screen.getByRole('button', { name: 'nationalities.visas.add' }));
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.add' }));
    }

    it('shows coverage required error when no coverage type selected', async () => {
      const { user } = setup();
      await openAddForm(user);
      // Fill other fields to enable save button (isAddDirty), but leave coverageType empty
      await user.selectOptions(screen.getByLabelText('nationalities.visas.visaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.entries'), 'MULTIPLE');
      await user.type(screen.getByLabelText('nationalities.visas.expiryDate'), '2027-12-31');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      expect(screen.getByText('nationalities.visas.errors.coverageRequired')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('shows country required error when COUNTRY selected but no country', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(
        screen.getByLabelText('nationalities.visas.coverageType'),
        'COUNTRY',
      );
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      expect(screen.getByText('nationalities.visas.errors.countryRequired')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('shows zone required error when ZONE selected but no zone', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByLabelText('nationalities.visas.coverageType'), 'ZONE');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      expect(screen.getByText('nationalities.visas.errors.zoneRequired')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('shows type required error', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(
        screen.getByLabelText('nationalities.visas.coverageType'),
        'COUNTRY',
      );
      await user.selectOptions(screen.getByTestId('country-combobox'), 'US');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      expect(screen.getByText('nationalities.visas.errors.typeRequired')).toBeInTheDocument();
    });

    it('shows entries required error', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(
        screen.getByLabelText('nationalities.visas.coverageType'),
        'COUNTRY',
      );
      await user.selectOptions(screen.getByTestId('country-combobox'), 'US');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.visaType'), 'TOURIST');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      expect(screen.getByText('nationalities.visas.errors.entriesRequired')).toBeInTheDocument();
    });

    it('shows expiry required error', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(
        screen.getByLabelText('nationalities.visas.coverageType'),
        'COUNTRY',
      );
      await user.selectOptions(screen.getByTestId('country-combobox'), 'US');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.visaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.visas.entries'), 'MULTIPLE');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      expect(screen.getByText('nationalities.visas.errors.expiryRequired')).toBeInTheDocument();
    });
  });

  describe('editing a visa', () => {
    it('shows edit form when Edit clicked', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.edit' })[0]!);
      expect(screen.getByLabelText('nationalities.visas.visaType')).toBeInTheDocument();
    });

    it('shows coverageType as read-only text on edit', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.edit' })[0]!);
      expect(
        screen.queryByRole('combobox', { name: 'nationalities.visas.coverageType' }),
      ).not.toBeInTheDocument();
      expect(screen.getByText('nationalities.visas.coverageTypes.COUNTRY')).toBeInTheDocument();
    });

    it('calls PATCH with updated visa type', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.edit' })[0]!);
      await user.selectOptions(screen.getByLabelText('nationalities.visas.visaType'), 'BUSINESS');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          `/v1/users/me/nationalities/${NATIONALITY_ID}/visas/visa-1`,
          expect.objectContaining({ visaType: 'BUSINESS' }),
        ),
      );
    });

    it('shows success toast after update', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.edit' })[0]!);
      await user.selectOptions(screen.getByLabelText('nationalities.visas.visaType'), 'BUSINESS');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('nationalities.visas.updateSuccess'),
      );
    });

    it('shows error toast when update fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('network'));
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.edit' })[0]!);
      await user.selectOptions(screen.getByLabelText('nationalities.visas.visaType'), 'BUSINESS');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('nationalities.visas.saveError'),
      );
    });

    it('cancels edit when Cancel clicked', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.edit' })[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.cancel' }));
      expect(screen.queryByLabelText('nationalities.visas.visaType')).not.toBeInTheDocument();
    });

    it('shows entries required error in edit form when entries is cleared', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.edit' })[0]!);
      await user.selectOptions(screen.getByLabelText('nationalities.visas.entries'), '');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      expect(screen.getByText('nationalities.visas.errors.entriesRequired')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('shows expiry required error in edit form when expiry date is cleared', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.edit' })[0]!);
      await user.clear(screen.getByLabelText('nationalities.visas.expiryDate'));
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      expect(screen.getByText('nationalities.visas.errors.expiryRequired')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('shows type required error in edit form when visa type is cleared', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.edit' })[0]!);
      await user.selectOptions(screen.getByLabelText('nationalities.visas.visaType'), '');
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.save' }));
      expect(screen.getByText('nationalities.visas.errors.typeRequired')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });
  });

  describe('EXPIRING_SOON status badge', () => {
    it('renders EXPIRING_SOON badge with amber style', async () => {
      mocks.mockGet.mockResolvedValue({
        data: [{ ...sampleVisas[0]!, visaStatus: DocumentStatus.EXPIRING_SOON }],
      });
      setup();
      await waitFor(() =>
        expect(
          screen.getByText(`nationalities.documentStatus.${DocumentStatus.EXPIRING_SOON}`),
        ).toBeInTheDocument(),
      );
    });
  });

  describe('deleting a visa', () => {
    it('requires second click to confirm delete', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.delete' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.delete' })[0]!);
      expect(mocks.mockDelete).not.toHaveBeenCalled();
      expect(
        screen.getByRole('button', { name: 'nationalities.visas.deleteConfirm' }),
      ).toBeInTheDocument();
    });

    it('calls DELETE after confirmation', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.delete' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.delete' })[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockDelete).toHaveBeenCalledWith(
          `/v1/users/me/nationalities/${NATIONALITY_ID}/visas/visa-1`,
        ),
      );
    });

    it('shows success toast after delete', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.delete' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.delete' })[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('nationalities.visas.deleteSuccess'),
      );
    });

    it('shows error toast when delete fails', async () => {
      mocks.mockDelete.mockRejectedValue(new Error('network'));
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.visas.delete' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.visas.delete' })[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.visas.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('nationalities.visas.deleteError'),
      );
    });
  });
});

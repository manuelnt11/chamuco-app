import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentStatus, EtaType, VisaEntries } from '@chamuco/shared-types';

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
  CountryCombobox: ({
    value,
    onChange,
    'aria-labelledby': labelledBy,
  }: {
    value: string;
    onChange: (iso: string) => void;
    'aria-labelledby'?: string;
  }) => (
    <select
      data-testid="country-combobox"
      aria-labelledby={labelledBy}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select country</option>
      <option value="CA">Canada</option>
      <option value="AU">Australia</option>
    </select>
  ),
}));

import { EtasSubsection } from './EtasSubsection';
import type { EtaDto } from './EtasSubsection';

const NATIONALITY_ID = 'nat-1';
const PASSPORT_NUMBER = 'AB123456';

const sampleEtas: EtaDto[] = [
  {
    id: 'eta-1',
    userNationalityId: NATIONALITY_ID,
    passportNumber: PASSPORT_NUMBER,
    destinationCountry: 'CA',
    authorizationNumber: 'A1B2C3D4E5',
    etaType: EtaType.TOURIST,
    entries: VisaEntries.MULTIPLE,
    expiryDate: '2027-12-31',
    etaStatus: DocumentStatus.ACTIVE,
    notes: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'eta-2',
    userNationalityId: NATIONALITY_ID,
    passportNumber: 'XY987654',
    destinationCountry: 'AU',
    authorizationNumber: 'Z9Y8X7W6',
    etaType: EtaType.TRANSIT,
    entries: VisaEntries.SINGLE,
    expiryDate: '2022-01-01',
    etaStatus: DocumentStatus.EXPIRED,
    notes: 'Old ETA',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

function setup(passportNumber: string | null = PASSPORT_NUMBER) {
  const user = userEvent.setup();
  render(<EtasSubsection nationalityId={NATIONALITY_ID} passportNumber={passportNumber} />);
  return { user };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockGet.mockResolvedValue({ data: sampleEtas });
  mocks.mockPost.mockResolvedValue({});
  mocks.mockPatch.mockResolvedValue({});
  mocks.mockDelete.mockResolvedValue({});
});

describe('EtasSubsection', () => {
  describe('loading and rendering', () => {
    it('fetches ETAs on mount', async () => {
      setup();
      await waitFor(() =>
        expect(mocks.mockGet).toHaveBeenCalledWith(
          `/v1/users/me/nationalities/${NATIONALITY_ID}/etas`,
        ),
      );
    });

    it('renders heading after loading', async () => {
      setup();
      await waitFor(() =>
        expect(screen.getByText('nationalities.etas.heading')).toBeInTheDocument(),
      );
    });

    it('renders passport numbers', async () => {
      setup();
      await waitFor(() => expect(screen.getByText(PASSPORT_NUMBER)).toBeInTheDocument());
      expect(screen.getByText('XY987654')).toBeInTheDocument();
    });

    it('renders ETA type labels', async () => {
      setup();
      await waitFor(() =>
        expect(screen.getByText('nationalities.etas.etaTypes.TOURIST')).toBeInTheDocument(),
      );
      expect(screen.getByText('nationalities.etas.etaTypes.TRANSIT')).toBeInTheDocument();
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
      await waitFor(() => expect(screen.getByText('Old ETA')).toBeInTheDocument());
    });

    it('renders empty state when no ETAs', async () => {
      mocks.mockGet.mockResolvedValue({ data: [] });
      setup();
      await waitFor(() => expect(screen.getByText('nationalities.etas.empty')).toBeInTheDocument());
    });

    it('renders Add ETA button', async () => {
      setup();
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'nationalities.etas.add' })).toBeInTheDocument(),
      );
    });
  });

  describe('no passport', () => {
    it('disables Add ETA button when passportNumber is null', async () => {
      setup(null);
      await waitFor(() => screen.getByRole('button', { name: 'nationalities.etas.add' }));
      expect(screen.getByRole('button', { name: 'nationalities.etas.add' })).toBeDisabled();
    });

    it('shows hint message when passportNumber is null', async () => {
      setup(null);
      await waitFor(() =>
        expect(screen.getByText('nationalities.etas.noPassportHint')).toBeInTheDocument(),
      );
    });

    it('does not show hint when passportNumber is set', async () => {
      setup();
      await waitFor(() => screen.getByRole('button', { name: 'nationalities.etas.add' }));
      expect(screen.queryByText('nationalities.etas.noPassportHint')).not.toBeInTheDocument();
    });
  });

  describe('adding an ETA', () => {
    async function openAddForm(user: ReturnType<typeof userEvent.setup>) {
      await waitFor(() => screen.getByRole('button', { name: 'nationalities.etas.add' }));
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.add' }));
    }

    it('shows add form when Add button is clicked', async () => {
      const { user } = setup();
      await openAddForm(user);
      expect(screen.getByLabelText('nationalities.etas.destinationCountry')).toBeInTheDocument();
    });

    it('shows active passport read-only in add form', async () => {
      const { user } = setup();
      await openAddForm(user);
      expect(screen.getAllByText(PASSPORT_NUMBER).length).toBeGreaterThanOrEqual(1);
    });

    it('hides Add button while form is open', async () => {
      const { user } = setup();
      await openAddForm(user);
      expect(
        screen.queryByRole('button', { name: 'nationalities.etas.add' }),
      ).not.toBeInTheDocument();
    });

    it('calls POST with passport from nationality', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByTestId('country-combobox'), 'CA');
      await user.type(
        screen.getByLabelText('nationalities.etas.authorizationNumber'),
        'A1B2C3D4E5',
      );
      await user.selectOptions(screen.getByLabelText('nationalities.etas.etaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.entries'), 'MULTIPLE');
      await user.type(screen.getByLabelText('nationalities.etas.expiryDate'), '2027-12-31');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith(
          `/v1/users/me/nationalities/${NATIONALITY_ID}/etas`,
          expect.objectContaining({
            destinationCountry: 'CA',
            authorizationNumber: 'A1B2C3D4E5',
            etaType: 'TOURIST',
            entries: 'MULTIPLE',
            expiryDate: '2027-12-31',
            notes: null,
          }),
        ),
      );
    });

    it('auto-uppercases authorization number input', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.type(screen.getByLabelText('nationalities.etas.authorizationNumber'), 'a1b2c3');
      expect(screen.getByLabelText('nationalities.etas.authorizationNumber')).toHaveValue('A1B2C3');
    });

    it('includes notes in POST when provided', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByTestId('country-combobox'), 'CA');
      await user.type(screen.getByLabelText('nationalities.etas.authorizationNumber'), 'A1B2C3');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.etaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.entries'), 'SINGLE');
      await user.type(screen.getByLabelText('nationalities.etas.expiryDate'), '2027-12-31');
      await user.type(screen.getByLabelText('nationalities.etas.notes'), 'My note');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith(
          `/v1/users/me/nationalities/${NATIONALITY_ID}/etas`,
          expect.objectContaining({ notes: 'My note' }),
        ),
      );
    });

    it('shows success toast after add', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByTestId('country-combobox'), 'CA');
      await user.type(screen.getByLabelText('nationalities.etas.authorizationNumber'), 'A1B2C3');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.etaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.entries'), 'SINGLE');
      await user.type(screen.getByLabelText('nationalities.etas.expiryDate'), '2027-12-31');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('nationalities.etas.addSuccess'),
      );
    });

    it('shows error toast when add fails', async () => {
      mocks.mockPost.mockRejectedValue(new Error('network'));
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByTestId('country-combobox'), 'CA');
      await user.type(screen.getByLabelText('nationalities.etas.authorizationNumber'), 'A1B2C3');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.etaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.entries'), 'SINGLE');
      await user.type(screen.getByLabelText('nationalities.etas.expiryDate'), '2027-12-31');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('nationalities.etas.saveError'),
      );
    });

    it('cancels add form when Cancel clicked', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.cancel' }));
      expect(
        screen.queryByLabelText('nationalities.etas.destinationCountry'),
      ).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    async function openAddForm(user: ReturnType<typeof userEvent.setup>) {
      await waitFor(() => screen.getByRole('button', { name: 'nationalities.etas.add' }));
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.add' }));
    }

    it('shows country required error when no destination selected', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.type(screen.getByLabelText('nationalities.etas.authorizationNumber'), 'A1B2C3');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.etaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.entries'), 'SINGLE');
      await user.type(screen.getByLabelText('nationalities.etas.expiryDate'), '2027-12-31');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      expect(screen.getByText('nationalities.etas.errors.countryRequired')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('shows auth number required error', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByTestId('country-combobox'), 'CA');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.etaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.entries'), 'SINGLE');
      await user.type(screen.getByLabelText('nationalities.etas.expiryDate'), '2027-12-31');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      expect(screen.getByText('nationalities.etas.errors.authNumberRequired')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('shows auth number format error when authorization contains spaces', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByTestId('country-combobox'), 'CA');
      await user.type(screen.getByLabelText('nationalities.etas.authorizationNumber'), 'A1 B2');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.etaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.entries'), 'SINGLE');
      await user.type(screen.getByLabelText('nationalities.etas.expiryDate'), '2027-12-31');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      expect(screen.getByText('nationalities.etas.errors.authNumberFormat')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('accepts authorization number with hyphens', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByTestId('country-combobox'), 'CA');
      await user.type(screen.getByLabelText('nationalities.etas.authorizationNumber'), 'A1-B2C3');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.etaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.entries'), 'SINGLE');
      await user.type(screen.getByLabelText('nationalities.etas.expiryDate'), '2027-12-31');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      await waitFor(() => expect(mocks.mockPost).toHaveBeenCalledOnce());
    });

    it('shows type required error', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByTestId('country-combobox'), 'CA');
      await user.type(screen.getByLabelText('nationalities.etas.authorizationNumber'), 'A1B2C3');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      expect(screen.getByText('nationalities.etas.errors.typeRequired')).toBeInTheDocument();
    });

    it('shows entries required error', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByTestId('country-combobox'), 'CA');
      await user.type(screen.getByLabelText('nationalities.etas.authorizationNumber'), 'A1B2C3');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.etaType'), 'TOURIST');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      expect(screen.getByText('nationalities.etas.errors.entriesRequired')).toBeInTheDocument();
    });

    it('shows expiry required error', async () => {
      const { user } = setup();
      await openAddForm(user);
      await user.selectOptions(screen.getByTestId('country-combobox'), 'CA');
      await user.type(screen.getByLabelText('nationalities.etas.authorizationNumber'), 'A1B2C3');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.etaType'), 'TOURIST');
      await user.selectOptions(screen.getByLabelText('nationalities.etas.entries'), 'SINGLE');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      expect(screen.getByText('nationalities.etas.errors.expiryRequired')).toBeInTheDocument();
    });
  });

  describe('editing an ETA', () => {
    it('shows edit form when Edit clicked', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.edit' })[0]!);
      expect(screen.getByLabelText('nationalities.etas.authorizationNumber')).toBeInTheDocument();
    });

    it('shows passportNumber as read-only in edit form', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.edit' })[0]!);
      expect(
        screen.queryByRole('textbox', { name: 'nationalities.etas.passportNumber' }),
      ).not.toBeInTheDocument();
      const passportTexts = screen.getAllByText(PASSPORT_NUMBER);
      expect(passportTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('pre-fills authorization number in edit form', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.edit' })[0]!);
      expect(screen.getByLabelText('nationalities.etas.authorizationNumber')).toHaveValue(
        'A1B2C3D4E5',
      );
    });

    it('auto-uppercases authorization number in edit form', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.edit' })[0]!);
      const authInput = screen.getByLabelText('nationalities.etas.authorizationNumber');
      await user.clear(authInput);
      await user.type(authInput, 'new-auth');
      expect(authInput).toHaveValue('NEW-AUTH');
    });

    it('shows auth format error on edit when authorization contains spaces', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.edit' })[0]!);
      const authInput = screen.getByLabelText('nationalities.etas.authorizationNumber');
      await user.clear(authInput);
      await user.type(authInput, 'BAD AUTH');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      expect(screen.getByText('nationalities.etas.errors.authNumberFormat')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('calls PATCH with updated authorization number', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.edit' })[0]!);
      const authInput = screen.getByLabelText('nationalities.etas.authorizationNumber');
      await user.clear(authInput);
      await user.type(authInput, 'NEWAUTH123');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          `/v1/users/me/nationalities/${NATIONALITY_ID}/etas/eta-1`,
          expect.objectContaining({ authorizationNumber: 'NEWAUTH123' }),
        ),
      );
    });

    it('shows success toast after update', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.edit' })[0]!);
      const authInput = screen.getByLabelText('nationalities.etas.authorizationNumber');
      await user.clear(authInput);
      await user.type(authInput, 'NEWAUTH123');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('nationalities.etas.updateSuccess'),
      );
    });

    it('shows error toast when update fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('network'));
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.edit' })[0]!);
      const authInput = screen.getByLabelText('nationalities.etas.authorizationNumber');
      await user.clear(authInput);
      await user.type(authInput, 'NEWAUTH123');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('nationalities.etas.saveError'),
      );
    });

    it('cancels edit when Cancel clicked', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.edit' })[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.cancel' }));
      expect(
        screen.queryByLabelText('nationalities.etas.authorizationNumber'),
      ).not.toBeInTheDocument();
    });

    it('shows entries required error in edit form when entries is cleared', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.edit' })[0]!);
      await user.selectOptions(screen.getByLabelText('nationalities.etas.entries'), '');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      expect(screen.getByText('nationalities.etas.errors.entriesRequired')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('shows expiry required error in edit form when expiry date is cleared', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.edit' })[0]!);
      await user.clear(screen.getByLabelText('nationalities.etas.expiryDate'));
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      expect(screen.getByText('nationalities.etas.errors.expiryRequired')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('shows type required error in edit form when eta type is cleared', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.edit' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.edit' })[0]!);
      await user.selectOptions(screen.getByLabelText('nationalities.etas.etaType'), '');
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.save' }));
      expect(screen.getByText('nationalities.etas.errors.typeRequired')).toBeInTheDocument();
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });
  });

  describe('EXPIRING_SOON status badge', () => {
    it('renders EXPIRING_SOON badge with amber style', async () => {
      mocks.mockGet.mockResolvedValue({
        data: [{ ...sampleEtas[0]!, etaStatus: DocumentStatus.EXPIRING_SOON }],
      });
      setup();
      await waitFor(() =>
        expect(
          screen.getByText(`nationalities.documentStatus.${DocumentStatus.EXPIRING_SOON}`),
        ).toBeInTheDocument(),
      );
    });
  });

  describe('deleting an ETA', () => {
    it('requires second click to confirm delete', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.delete' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.delete' })[0]!);
      expect(mocks.mockDelete).not.toHaveBeenCalled();
      expect(
        screen.getByRole('button', { name: 'nationalities.etas.deleteConfirm' }),
      ).toBeInTheDocument();
    });

    it('calls DELETE after confirmation', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.delete' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.delete' })[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockDelete).toHaveBeenCalledWith(
          `/v1/users/me/nationalities/${NATIONALITY_ID}/etas/eta-1`,
        ),
      );
    });

    it('shows success toast after delete', async () => {
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.delete' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.delete' })[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('nationalities.etas.deleteSuccess'),
      );
    });

    it('shows error toast when delete fails', async () => {
      mocks.mockDelete.mockRejectedValue(new Error('network'));
      const { user } = setup();
      await waitFor(() => screen.getAllByRole('button', { name: 'nationalities.etas.delete' }));
      await user.click(screen.getAllByRole('button', { name: 'nationalities.etas.delete' })[0]!);
      await user.click(screen.getByRole('button', { name: 'nationalities.etas.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('nationalities.etas.deleteError'),
      );
    });
  });
});

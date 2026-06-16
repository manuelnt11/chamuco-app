import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripVisibility } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockToastError: vi.fn(),
  mockOnSuccess: vi.fn(),
  mockIsAxiosError: vi.fn(),
  mockGetSignedUrl: vi.fn(),
  mockUploadToGcs: vi.fn(),
}));

vi.mock('axios', () => ({
  default: { isAxiosError: mocks.mockIsAxiosError },
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    post: mocks.mockPost,
    patch: mocks.mockPatch,
  },
}));

vi.mock('@/services/uploads.service', () => ({
  getSignedUrl: mocks.mockGetSignedUrl,
}));

vi.mock('@/services/gcs-upload', () => ({
  uploadToGcs: mocks.mockUploadToGcs,
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { error: mocks.mockToastError },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key.replace(/^(?:trips|common):/, ''),
  }),
}));

vi.mock('@chamuco/shared-utils', () => ({
  getTwemojiUrl: (emoji: string) => `https://twemoji/${emoji}.png`,
}));

vi.mock('@/lib/avatar-emojis', () => ({
  AVATAR_EMOJIS: ['🏖️', '🌍', '✈️'],
}));

vi.mock('@/components/ui/crop-modal', () => ({
  CropModal: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (blob: Blob) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="crop-modal">
      <button
        onClick={() => onConfirm(new Blob(['img'], { type: 'image/jpeg' }))}
        data-testid="crop-confirm"
      >
        confirm-crop
      </button>
      <button onClick={onCancel} data-testid="crop-cancel">
        cancel-crop
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/country-combobox', () => ({
  CountryCombobox: ({
    value,
    onChange,
    'data-testid': testId,
  }: {
    value: string;
    onChange: (iso2: string) => void;
    'data-testid'?: string;
  }) => (
    <select
      data-testid={testId ?? 'country-combobox'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">—</option>
      <option value="MX">Mexico</option>
      <option value="CO">Colombia</option>
      <option value="US">United States</option>
    </select>
  ),
}));

vi.mock('@/components/ui/city-combobox', () => ({
  CityCombobox: ({
    value,
    onChange,
    'data-testid': testId,
  }: {
    value: string;
    onChange: (city: string) => void;
    'data-testid'?: string;
  }) => (
    <input
      data-testid={testId ?? 'city-combobox'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('@/components/ui/timezone-combobox', () => ({
  TimezoneCombobox: ({ value, onChange }: { value: string; onChange: (tz: string) => void }) => (
    <select
      data-testid="timezone-combobox"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">—</option>
      <option value="America/Mexico_City">America/Mexico_City</option>
    </select>
  ),
}));

vi.mock('@/components/ui/group-autocomplete', () => ({
  GroupAutocomplete: () => <input data-testid="group-autocomplete" readOnly />,
}));

import { TripForm } from './TripForm';

const mockTrip = {
  id: 'trip-uuid',
  name: 'Cancún 2026',
  description: null,
  status: 'DRAFT' as const,
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  departureCountry: 'MX',
  departureCity: 'CIUDAD DE MEXICO',
  landingCountry: 'MX',
  landingCity: 'CANCUN',
  defaultTimezone: null,
  defaultCurrency: null,
  itineraryNotes: null,
  agencyId: null,
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  requiresConfirmation: false,
  feedbackOpenUntil: null,
  coverUrl: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockPost.mockResolvedValue({ data: mockTrip });
  mocks.mockPatch.mockResolvedValue({ data: mockTrip });
  mocks.mockIsAxiosError.mockReturnValue(false);
  mocks.mockGetSignedUrl.mockResolvedValue({
    uploadUrl: 'https://storage.googleapis.com/signed',
    objectKey: 'trip-covers/trip-uuid/cover.jpg',
  });
  mocks.mockUploadToGcs.mockResolvedValue(undefined);
});

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('form.name'), 'Cancún 2026');
  await user.type(screen.getByLabelText('form.startDate'), '2026-12-01');
  // endDate auto-fills to '2026-12-02' when startDate is set
  await user.clear(screen.getByLabelText('form.participantCapacity'));
  await user.type(screen.getByLabelText('form.participantCapacity'), '10');
  // departure country + city
  const countrySelects = screen.getAllByTestId('country-combobox');
  await user.selectOptions(countrySelects[0]!, 'MX');
  const cityInputs = screen.getAllByTestId('city-combobox');
  await user.type(cityInputs[0]!, 'CIUDAD DE MEXICO');
}

function setupCreate() {
  const user = userEvent.setup();
  render(<TripForm mode="create" onSuccess={mocks.mockOnSuccess} />);
  return { user };
}

function setupEdit() {
  const user = userEvent.setup();
  render(
    <TripForm
      mode="edit"
      tripId="trip-uuid"
      initialValues={{
        name: 'Cancún 2026',
        description: null,
        visibility: TripVisibility.PUBLIC,
        startDate: '2026-12-01',
        endDate: '2026-12-08',
        participantCapacity: 10,
        departureCountry: 'MX',
        departureCity: 'CIUDAD DE MEXICO',
        landingCountry: 'MX',
        landingCity: 'CIUDAD DE MEXICO',
        defaultTimezone: null,
        defaultCurrency: null,
        isTravelingParticipant: true,
      }}
      onSuccess={mocks.mockOnSuccess}
    />,
  );
  return { user };
}

describe('TripForm', () => {
  describe('create mode rendering', () => {
    it('renders all required fields', () => {
      setupCreate();
      expect(screen.getByLabelText('form.name')).toBeInTheDocument();
      expect(screen.getByLabelText('form.startDate')).toBeInTheDocument();
      expect(screen.getByLabelText('form.endDate')).toBeInTheDocument();
      expect(screen.getByLabelText('form.participantCapacity')).toBeInTheDocument();
      expect(screen.getByLabelText('form.isTravelingParticipant')).toBeInTheDocument();
      expect(screen.getByText('visibility.label')).toBeInTheDocument();
      expect(screen.getByDisplayValue(TripVisibility.PUBLIC)).toBeInTheDocument();
      expect(screen.getByDisplayValue(TripVisibility.PRIVATE)).toBeInTheDocument();
    });

    it('shows create submit button', () => {
      setupCreate();
      expect(screen.getByRole('button', { name: 'form.submit' })).toBeInTheDocument();
    });

    it('submit disabled when name is empty', () => {
      setupCreate();
      expect(screen.getByRole('button', { name: 'form.submit' })).toBeDisabled();
    });

    it('landing location fields hidden by default', () => {
      setupCreate();
      expect(screen.queryByText('form.landingLocation')).not.toBeInTheDocument();
    });

    it('shows landing location fields when checkbox is checked', async () => {
      const { user } = setupCreate();
      await user.click(screen.getByLabelText('form.differentReturn'));
      expect(screen.getByText('form.landingLocation')).toBeInTheDocument();
    });

    it('shows cover section with emoji and photo tabs', () => {
      setupCreate();
      expect(screen.getByText('form.cover.label')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'form.cover.tabImage' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'form.cover.tabEmoji' })).toBeInTheDocument();
    });
  });

  describe('edit mode rendering', () => {
    it('pre-fills initial values', () => {
      setupEdit();
      expect(screen.getByDisplayValue('Cancún 2026')).toBeInTheDocument();
    });

    it('shows save changes submit button', () => {
      setupEdit();
      expect(screen.getByRole('button', { name: 'form.saveChanges' })).toBeInTheDocument();
    });

    it('hides cover section in edit mode', () => {
      setupEdit();
      expect(screen.queryByText('form.cover.label')).not.toBeInTheDocument();
    });
  });

  describe('end date validation', () => {
    it('auto-populates endDate to startDate + 1 when startDate is set', async () => {
      const { user } = setupCreate();
      await user.type(screen.getByLabelText('form.startDate'), '2026-12-01');
      expect(screen.getByLabelText('form.endDate')).toHaveValue('2026-12-02');
    });

    it('does not overwrite a valid endDate when startDate changes', async () => {
      const { user } = setupCreate();
      await user.type(screen.getByLabelText('form.startDate'), '2026-12-01');
      await user.clear(screen.getByLabelText('form.endDate'));
      await user.type(screen.getByLabelText('form.endDate'), '2026-12-15');
      await user.clear(screen.getByLabelText('form.startDate'));
      await user.type(screen.getByLabelText('form.startDate'), '2026-12-05');
      expect(screen.getByLabelText('form.endDate')).toHaveValue('2026-12-15');
    });

    it('shows error when endDate is before startDate', async () => {
      const { user } = setupCreate();
      await user.type(screen.getByLabelText('form.startDate'), '2026-12-08');
      await user.clear(screen.getByLabelText('form.endDate'));
      await user.type(screen.getByLabelText('form.endDate'), '2026-12-01');
      expect(screen.getByText('form.endDateError')).toBeInTheDocument();
    });

    it('does not show error when endDate equals startDate', async () => {
      const { user } = setupCreate();
      await user.type(screen.getByLabelText('form.startDate'), '2026-12-08');
      await user.clear(screen.getByLabelText('form.endDate'));
      await user.type(screen.getByLabelText('form.endDate'), '2026-12-08');
      expect(screen.queryByText('form.endDateError')).not.toBeInTheDocument();
    });
  });

  describe('cover section', () => {
    it('submit disabled when photo tab is active but no photo cropped', async () => {
      const { user } = setupCreate();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: 'form.cover.tabImage' }));
      expect(screen.getByRole('button', { name: 'form.submit' })).toBeDisabled();
    });

    it('shows CropModal after file is selected, then preview after confirm', async () => {
      const { user } = setupCreate();
      await user.click(screen.getByRole('button', { name: 'form.cover.tabImage' }));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['img'], 'cover.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
      await user.click(screen.getByTestId('crop-confirm'));
      expect(screen.queryByTestId('crop-modal')).not.toBeInTheDocument();
    });

    it('dismisses CropModal on cancel without setting preview', async () => {
      const { user } = setupCreate();
      await user.click(screen.getByRole('button', { name: 'form.cover.tabImage' }));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['img'], 'cover.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      await user.click(screen.getByTestId('crop-cancel'));
      expect(screen.queryByTestId('crop-modal')).not.toBeInTheDocument();
      // still on photo tab with the choose-file button, not a preview
      expect(
        screen.queryByRole('button', { name: 'form.cover.editButton' }),
      ).not.toBeInTheDocument();
    });

    it('creates trip with emoji cover, then updates with GCS cover on photo tab', async () => {
      const { user } = setupCreate();
      await fillRequiredFields(user);

      await user.click(screen.getByRole('button', { name: 'form.cover.tabImage' }));
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['img'], 'cover.jpg', { type: 'image/jpeg' }));
      await user.click(screen.getByTestId('crop-confirm'));

      await user.click(screen.getByRole('button', { name: 'form.submit' }));

      await waitFor(() => {
        // First: POST creates trip with emoji cover
        expect(mocks.mockPost).toHaveBeenCalledWith(
          '/v1/trips',
          expect.objectContaining({ cover: expect.objectContaining({ source: 'emoji' }) }),
        );
        // Then: get signed URL for TRIP_COVER
        expect(mocks.mockGetSignedUrl).toHaveBeenCalledWith(
          expect.objectContaining({ uploadType: 'TRIP_COVER', contextId: 'trip-uuid' }),
        );
        // Then: upload to GCS
        expect(mocks.mockUploadToGcs).toHaveBeenCalled();
        // Then: PATCH updates cover to GCS object
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/trips/trip-uuid',
          expect.objectContaining({
            cover: expect.objectContaining({
              source: 'gcs',
              target: 'trip-covers/trip-uuid/cover.jpg',
            }),
          }),
        );
      });

      expect(mocks.mockOnSuccess).toHaveBeenCalledWith(mockTrip);
    });

    it('navigates to trip with warning toast when GCS cover upload fails', async () => {
      mocks.mockUploadToGcs.mockRejectedValue(new Error('Network error'));
      const { user } = setupCreate();
      await fillRequiredFields(user);

      await user.click(screen.getByRole('button', { name: 'form.cover.tabImage' }));
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['img'], 'cover.jpg', { type: 'image/jpeg' }));
      await user.click(screen.getByTestId('crop-confirm'));

      await user.click(screen.getByRole('button', { name: 'form.submit' }));

      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('errors.coverUploadFailed');
        expect(mocks.mockOnSuccess).toHaveBeenCalledWith(mockTrip);
      });
    });
  });

  describe('create form submission', () => {
    it('calls POST /v1/trips with correct payload', async () => {
      const { user } = setupCreate();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: 'form.submit' }));

      await waitFor(() => {
        expect(mocks.mockPost).toHaveBeenCalledWith(
          '/v1/trips',
          expect.objectContaining({
            name: 'Cancún 2026',
            visibility: TripVisibility.PUBLIC,
            startDate: '2026-12-01',
            endDate: '2026-12-02', // auto-filled to startDate + 1 day
            participantCapacity: 10,
            departureCountry: 'MX',
            departureCity: 'CIUDAD DE MEXICO',
            // landing mirrors departure when hasDifferentReturn is false
            landingCountry: 'MX',
            landingCity: 'CIUDAD DE MEXICO',
            isTravelingParticipant: true,
            cover: expect.objectContaining({ source: 'emoji' }),
          }),
        );
      });
      expect(mocks.mockOnSuccess).toHaveBeenCalledWith(mockTrip);
    });

    it('uses separate landing location when hasDifferentReturn is checked', async () => {
      const { user } = setupCreate();
      await fillRequiredFields(user);
      await user.click(screen.getByLabelText('form.differentReturn'));

      const countrySelects = screen.getAllByTestId('country-combobox');
      await user.selectOptions(countrySelects[1]!, 'CO');
      const cityInputs = screen.getAllByTestId('city-combobox');
      await user.type(cityInputs[1]!, 'BOGOTA');

      await user.click(screen.getByRole('button', { name: 'form.submit' }));

      await waitFor(() => {
        expect(mocks.mockPost).toHaveBeenCalledWith(
          '/v1/trips',
          expect.objectContaining({
            departureCountry: 'MX',
            departureCity: 'CIUDAD DE MEXICO',
            landingCountry: 'CO',
            landingCity: 'BOGOTA',
          }),
        );
      });
    });

    it('shows createFailed toast on generic error', async () => {
      mocks.mockPost.mockRejectedValue(new Error('Server error'));
      const { user } = setupCreate();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: 'form.submit' }));

      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('errors.createFailed');
      });
      expect(mocks.mockOnSuccess).not.toHaveBeenCalled();
    });

    it('shows forbidden toast on 403 error', async () => {
      const err = { response: { status: 403 } };
      mocks.mockPost.mockRejectedValue(err);
      mocks.mockIsAxiosError.mockReturnValue(true);
      const { user } = setupCreate();
      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: 'form.submit' }));

      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('errors.forbidden');
      });
    });
  });

  describe('visibility restrictions (edit mode)', () => {
    it('disables PUBLIC option unconditionally when trip is PRIVATE', () => {
      render(
        <TripForm
          mode="edit"
          tripId="trip-uuid"
          initialValues={{
            name: 'Private Trip',
            description: null,
            visibility: TripVisibility.PRIVATE,
            startDate: '2026-12-01',
            endDate: '2026-12-08',
            participantCapacity: 5,
            departureCountry: 'MX',
            departureCity: 'CIUDAD DE MEXICO',
            landingCountry: 'MX',
            landingCity: 'CIUDAD DE MEXICO',
            defaultTimezone: null,
            defaultCurrency: null,
          }}
          onSuccess={mocks.mockOnSuccess}
        />,
      );
      expect(screen.getByDisplayValue(TripVisibility.PUBLIC)).toBeDisabled();
    });

    it('does not disable PUBLIC option when trip is already PUBLIC', () => {
      setupEdit();
      expect(screen.getByDisplayValue(TripVisibility.PUBLIC)).not.toBeDisabled();
    });

    it('shows cannotMakePublic toast on TRIP_CANNOT_BE_MADE_PUBLIC error', async () => {
      const err = { response: { status: 400, data: { error: 'TRIP_CANNOT_BE_MADE_PUBLIC' } } };
      mocks.mockPatch.mockRejectedValue(err);
      mocks.mockIsAxiosError.mockReturnValue(true);

      const { user } = setupEdit();
      await user.click(screen.getByRole('button', { name: 'form.saveChanges' }));

      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('errors.cannotMakePublic');
      });
    });
  });

  describe('visibility hint (create mode)', () => {
    it('shows irreversible hint when PRIVATE is selected', async () => {
      const { user } = setupCreate();
      await user.click(screen.getByDisplayValue(TripVisibility.PRIVATE));
      expect(screen.getByText('visibility.private_irreversible_hint')).toBeInTheDocument();
    });

    it('does not show irreversible hint when PUBLIC is selected', () => {
      setupCreate();
      expect(screen.queryByText('visibility.private_irreversible_hint')).not.toBeInTheDocument();
    });
  });
});

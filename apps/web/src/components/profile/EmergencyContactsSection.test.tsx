import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockRandomUUID: vi.fn(() => 'test-uuid-1234'),
  mockIsValidPhoneNumber: vi.fn(() => true),
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

vi.mock('libphonenumber-js', () => ({
  isValidPhoneNumber: mocks.mockIsValidPhoneNumber,
}));

vi.mock('countries-list', () => ({
  getCountryDataList: () => [
    { iso2: 'CO', name: 'Colombia', phone: [57] },
    { iso2: 'US', name: 'United States', phone: [1] },
  ],
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
      <option value="CO">Colombia (+57)</option>
      <option value="US">United States (+1)</option>
    </select>
  ),
  getCallingCode: (iso: string) => {
    if (iso === 'CO') return '+57';
    if (iso === 'US') return '+1';
    return '+0';
  },
}));

Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: mocks.mockRandomUUID },
  configurable: true,
});

import { EmergencyContactsSection } from './EmergencyContactsSection';
import type { EmergencyContactDto } from './EmergencyContactsSection';

const sampleContacts: EmergencyContactDto[] = [
  {
    id: 'contact-1',
    fullName: 'María García',
    phoneCountryCode: '+57',
    phoneLocalNumber: '3001234567',
    relationship: 'Mother',
    isPrimary: true,
  },
  {
    id: 'contact-2',
    fullName: 'Juan García',
    phoneCountryCode: '+57',
    phoneLocalNumber: '3107654321',
    relationship: 'Brother',
    isPrimary: false,
  },
];

function setup(contacts: EmergencyContactDto[] = sampleContacts) {
  const onRefresh = vi.fn();
  const user = userEvent.setup();
  render(<EmergencyContactsSection contacts={contacts} onRefresh={onRefresh} />);
  return { user, onRefresh };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockPost.mockResolvedValue({});
  mocks.mockPatch.mockResolvedValue({});
  mocks.mockDelete.mockResolvedValue({});
  mocks.mockIsValidPhoneNumber.mockReturnValue(true);
});

describe('EmergencyContactsSection', () => {
  describe('rendering', () => {
    it('renders the section heading', () => {
      setup();
      expect(screen.getByText('emergencyContacts.heading')).toBeInTheDocument();
    });

    it('renders existing contacts', () => {
      setup();
      expect(screen.getByText('María García')).toBeInTheDocument();
      expect(screen.getByText('Mother')).toBeInTheDocument();
      expect(screen.getByText('Juan García')).toBeInTheDocument();
      expect(screen.getByText('Brother')).toBeInTheDocument();
    });

    it('renders primary badge on primary contact', () => {
      setup();
      expect(screen.getByText('emergencyContacts.primaryBadge')).toBeInTheDocument();
    });

    it('does not render primary badge on non-primary contact', () => {
      setup();
      const badges = screen.getAllByText('emergencyContacts.primaryBadge');
      expect(badges).toHaveLength(1);
    });

    it('renders empty state when no contacts', () => {
      setup([]);
      expect(screen.getByText('emergencyContacts.empty')).toBeInTheDocument();
    });

    it('renders Add contact button', () => {
      setup();
      expect(screen.getByRole('button', { name: 'emergencyContacts.add' })).toBeInTheDocument();
    });
  });

  describe('adding a contact', () => {
    it('shows add form when Add button is clicked', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      expect(screen.getByLabelText('emergencyContacts.fullName')).toBeInTheDocument();
      expect(screen.getByLabelText('emergencyContacts.relationship')).toBeInTheDocument();
    });

    it('hides Add button while add form is open', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      expect(
        screen.queryByRole('button', { name: 'emergencyContacts.add' }),
      ).not.toBeInTheDocument();
    });

    it('calls POST /users/me/emergency-contacts with form values on submit', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.fullName'), 'Ana López');
      await user.type(screen.getByLabelText('emergencyContacts.phoneNumber'), '3009876543');
      await user.type(screen.getByLabelText('emergencyContacts.relationship'), 'Sister');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith('/v1/users/me/emergency-contacts', {
          id: 'test-uuid-1234',
          fullName: 'ANA LÓPEZ',
          phoneCountryCode: '+57',
          phoneLocalNumber: '3009876543',
          relationship: 'SISTER',
          isPrimary: true,
        }),
      );
    });

    it('defaults isPrimary to true when list is empty', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      expect(screen.getByRole('checkbox', { name: 'emergencyContacts.isPrimary' })).toBeChecked();
    });

    it('defaults isPrimary to false when list is non-empty', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      expect(
        screen.getByRole('checkbox', { name: 'emergencyContacts.isPrimary' }),
      ).not.toBeChecked();
    });

    it('calls onRefresh after adding', async () => {
      const { user, onRefresh } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.fullName'), 'Ana López');
      await user.type(screen.getByLabelText('emergencyContacts.phoneNumber'), '3009876543');
      await user.type(screen.getByLabelText('emergencyContacts.relationship'), 'Sister');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });

    it('shows success toast on add', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.fullName'), 'Ana López');
      await user.type(screen.getByLabelText('emergencyContacts.phoneNumber'), '3009876543');
      await user.type(screen.getByLabelText('emergencyContacts.relationship'), 'Sister');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('emergencyContacts.addSuccess'),
      );
    });

    it('hides add form after successful add', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.fullName'), 'Ana López');
      await user.type(screen.getByLabelText('emergencyContacts.phoneNumber'), '3009876543');
      await user.type(screen.getByLabelText('emergencyContacts.relationship'), 'Sister');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      await waitFor(() =>
        expect(screen.queryByLabelText('emergencyContacts.fullName')).not.toBeInTheDocument(),
      );
    });

    it('cancels add form when Cancel is clicked', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.cancel' }));
      expect(screen.queryByLabelText('emergencyContacts.fullName')).not.toBeInTheDocument();
    });

    it('shows error toast when add fails', async () => {
      mocks.mockPost.mockRejectedValue(new Error('network error'));
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.fullName'), 'Ana López');
      await user.type(screen.getByLabelText('emergencyContacts.phoneNumber'), '3009876543');
      await user.type(screen.getByLabelText('emergencyContacts.relationship'), 'Sister');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('emergencyContacts.saveError'),
      );
    });
  });

  describe('form validation', () => {
    it('shows fullName error when name is empty', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.phoneNumber'), '3009876543');
      await user.type(screen.getByLabelText('emergencyContacts.relationship'), 'Sister');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      expect(screen.getByText('emergencyContacts.errors.fullNameRequired')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('shows relationship error when relationship is empty', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.fullName'), 'Ana López');
      await user.type(screen.getByLabelText('emergencyContacts.phoneNumber'), '3009876543');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      expect(screen.getByText('emergencyContacts.errors.relationshipRequired')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('shows phone required error when phone is empty', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.fullName'), 'Ana López');
      await user.type(screen.getByLabelText('emergencyContacts.relationship'), 'Sister');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      expect(screen.getByText('emergencyContacts.errors.phoneRequired')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('shows invalid phone error when phone fails validation', async () => {
      mocks.mockIsValidPhoneNumber.mockReturnValue(false);
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.fullName'), 'Ana López');
      await user.type(screen.getByLabelText('emergencyContacts.phoneNumber'), '123');
      await user.type(screen.getByLabelText('emergencyContacts.relationship'), 'Sister');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      expect(screen.getByText('emergencyContacts.errors.invalidPhone')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('shows fullNameInvalid error when name contains special characters', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.fullName'), 'Ana123!');
      await user.type(screen.getByLabelText('emergencyContacts.phoneNumber'), '3009876543');
      await user.type(screen.getByLabelText('emergencyContacts.relationship'), 'Sister');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      expect(screen.getByText('emergencyContacts.errors.fullNameInvalid')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('shows relationshipInvalid error when relationship contains special characters', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.fullName'), 'Ana López');
      await user.type(screen.getByLabelText('emergencyContacts.phoneNumber'), '3009876543');
      await user.type(screen.getByLabelText('emergencyContacts.relationship'), 'Sis@ter!');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      expect(screen.getByText('emergencyContacts.errors.relationshipInvalid')).toBeInTheDocument();
      expect(mocks.mockPost).not.toHaveBeenCalled();
    });

    it('accepts accented characters in fullName and relationship', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.fullName'), 'María José');
      await user.type(screen.getByLabelText('emergencyContacts.phoneNumber'), '3009876543');
      await user.type(screen.getByLabelText('emergencyContacts.relationship'), 'Hermana');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith(
          '/v1/users/me/emergency-contacts',
          expect.objectContaining({ fullName: 'MARÍA JOSÉ', relationship: 'HERMANA' }),
        ),
      );
    });
  });

  describe('editing a contact', () => {
    it('shows inline edit form when Edit is clicked', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'emergencyContacts.edit' });
      await user.click(editButtons[0]!);
      expect(screen.getByDisplayValue('MARÍA GARCÍA')).toBeInTheDocument();
    });

    it('pre-fills edit form with existing values', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'emergencyContacts.edit' });
      await user.click(editButtons[0]!);
      expect(screen.getByLabelText('emergencyContacts.fullName')).toHaveValue('MARÍA GARCÍA');
      expect(screen.getByLabelText('emergencyContacts.relationship')).toHaveValue('MOTHER');
      expect(screen.getByRole('checkbox', { name: 'emergencyContacts.isPrimary' })).toBeChecked();
    });

    it('calls PATCH on save', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'emergencyContacts.edit' });
      await user.click(editButtons[0]!);
      const nameInput = screen.getByLabelText('emergencyContacts.fullName');
      await user.clear(nameInput);
      await user.type(nameInput, 'María López');
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/emergency-contacts/contact-1', {
          fullName: 'MARÍA LÓPEZ',
          phoneCountryCode: '+57',
          phoneLocalNumber: '3001234567',
          relationship: 'MOTHER',
          isPrimary: true,
        }),
      );
    });

    it('shows success toast after update', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'emergencyContacts.edit' });
      await user.click(editButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('emergencyContacts.updateSuccess'),
      );
    });

    it('calls onRefresh after update', async () => {
      const { user, onRefresh } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'emergencyContacts.edit' });
      await user.click(editButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });

    it('cancels edit form when Cancel is clicked', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'emergencyContacts.edit' });
      await user.click(editButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.cancel' }));
      expect(screen.queryByDisplayValue('MARÍA GARCÍA')).not.toBeInTheDocument();
    });

    it('shows error toast when update fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('network error'));
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'emergencyContacts.edit' });
      await user.click(editButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('emergencyContacts.saveError'),
      );
    });

    it('sends isPrimary: false when checkbox is unchecked on edit', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'emergencyContacts.edit' });
      await user.click(editButtons[0]!);
      await user.click(screen.getByRole('checkbox', { name: 'emergencyContacts.isPrimary' }));
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/emergency-contacts/contact-1',
          expect.objectContaining({ isPrimary: false }),
        ),
      );
    });
  });

  describe('deleting a contact', () => {
    it('requires a second click to confirm delete', async () => {
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', {
        name: 'emergencyContacts.delete',
      });
      await user.click(deleteButtons[0]!);
      expect(mocks.mockDelete).not.toHaveBeenCalled();
      expect(
        screen.getByRole('button', { name: 'emergencyContacts.deleteConfirm' }),
      ).toBeInTheDocument();
    });

    it('calls DELETE after confirmation click', async () => {
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', {
        name: 'emergencyContacts.delete',
      });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockDelete).toHaveBeenCalledWith('/v1/users/me/emergency-contacts/contact-1'),
      );
    });

    it('calls onRefresh after delete', async () => {
      const { user, onRefresh } = setup();
      const deleteButtons = screen.getAllByRole('button', {
        name: 'emergencyContacts.delete',
      });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.deleteConfirm' }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });

    it('shows success toast after delete', async () => {
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', {
        name: 'emergencyContacts.delete',
      });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('emergencyContacts.deleteSuccess'),
      );
    });

    it('shows error toast when delete fails', async () => {
      mocks.mockDelete.mockRejectedValue(new Error('network error'));
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', {
        name: 'emergencyContacts.delete',
      });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('emergencyContacts.saveError'),
      );
    });
  });

  describe('isPrimary toggle', () => {
    it('sends isPrimary: true when checkbox is checked on add', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.add' }));
      await user.type(screen.getByLabelText('emergencyContacts.fullName'), 'Carlos Pérez');
      await user.type(screen.getByLabelText('emergencyContacts.phoneNumber'), '3009876543');
      await user.type(screen.getByLabelText('emergencyContacts.relationship'), 'Father');
      await user.click(screen.getByRole('checkbox', { name: 'emergencyContacts.isPrimary' }));
      await user.click(screen.getByRole('button', { name: 'emergencyContacts.save' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith(
          '/v1/users/me/emergency-contacts',
          expect.objectContaining({ isPrimary: true }),
        ),
      );
    });
  });
});

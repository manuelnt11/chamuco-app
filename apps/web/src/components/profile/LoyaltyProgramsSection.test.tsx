import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockRandomUUID: vi.fn(() => 'test-uuid-1234'),
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
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Polyfill crypto.randomUUID for jsdom
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: mocks.mockRandomUUID },
  configurable: true,
});

import { LoyaltyProgramsSection } from './LoyaltyProgramsSection';
import type { LoyaltyProgramDto } from './LoyaltyProgramsSection';

const samplePrograms: LoyaltyProgramDto[] = [
  { id: 'prog-1', programName: 'LifeMiles', memberId: 'LM123', notes: 'Gold tier' },
  { id: 'prog-2', programName: 'Delta SkyMiles', memberId: 'DL456', notes: null },
];

function setup(programs: LoyaltyProgramDto[] = samplePrograms) {
  const onRefresh = vi.fn();
  const user = userEvent.setup();
  render(<LoyaltyProgramsSection programs={programs} onRefresh={onRefresh} />);
  return { user, onRefresh };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockPost.mockResolvedValue({});
  mocks.mockPatch.mockResolvedValue({});
  mocks.mockDelete.mockResolvedValue({});
});

describe('LoyaltyProgramsSection', () => {
  describe('rendering', () => {
    it('renders the section heading', () => {
      setup();
      expect(screen.getByText('loyaltyPrograms.heading')).toBeInTheDocument();
    });

    it('renders existing programs', () => {
      setup();
      expect(screen.getByText('LifeMiles')).toBeInTheDocument();
      expect(screen.getByText('LM123')).toBeInTheDocument();
      expect(screen.getByText('Delta SkyMiles')).toBeInTheDocument();
    });

    it('renders notes when present', () => {
      setup();
      expect(screen.getByText('Gold tier')).toBeInTheDocument();
    });

    it('renders empty state when no programs', () => {
      setup([]);
      expect(screen.getByText('loyaltyPrograms.empty')).toBeInTheDocument();
    });

    it('renders Add program button', () => {
      setup();
      expect(screen.getByRole('button', { name: 'loyaltyPrograms.add' })).toBeInTheDocument();
    });
  });

  describe('adding a program', () => {
    it('shows add form when Add button is clicked', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.add' }));
      expect(screen.getByLabelText('loyaltyPrograms.programName')).toBeInTheDocument();
      expect(screen.getByLabelText('loyaltyPrograms.memberId')).toBeInTheDocument();
    });

    it('hides Add button while add form is open', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.add' }));
      expect(screen.queryByRole('button', { name: 'loyaltyPrograms.add' })).not.toBeInTheDocument();
    });

    it('calls POST /users/me/loyalty-programs with form values on submit', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.add' }));
      await user.type(screen.getByLabelText('loyaltyPrograms.programName'), 'Avianca');
      await user.type(screen.getByLabelText('loyaltyPrograms.memberId'), 'AV999');
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.save' }));
      await waitFor(() =>
        expect(mocks.mockPost).toHaveBeenCalledWith('/v1/users/me/loyalty-programs', {
          id: 'test-uuid-1234',
          programName: 'Avianca',
          memberId: 'AV999',
          notes: null,
        }),
      );
    });

    it('calls onRefresh after adding', async () => {
      const { user, onRefresh } = setup([]);
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.add' }));
      await user.type(screen.getByLabelText('loyaltyPrograms.programName'), 'Avianca');
      await user.type(screen.getByLabelText('loyaltyPrograms.memberId'), 'AV999');
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.save' }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });

    it('shows success toast on add', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.add' }));
      await user.type(screen.getByLabelText('loyaltyPrograms.programName'), 'Avianca');
      await user.type(screen.getByLabelText('loyaltyPrograms.memberId'), 'AV999');
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.save' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('loyaltyPrograms.addSuccess'),
      );
    });

    it('hides add form after successful add', async () => {
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.add' }));
      await user.type(screen.getByLabelText('loyaltyPrograms.programName'), 'Avianca');
      await user.type(screen.getByLabelText('loyaltyPrograms.memberId'), 'AV999');
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.save' }));
      await waitFor(() =>
        expect(screen.queryByLabelText('loyaltyPrograms.programName')).not.toBeInTheDocument(),
      );
    });

    it('cancels add form when Cancel is clicked', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.add' }));
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.cancel' }));
      expect(screen.queryByLabelText('loyaltyPrograms.programName')).not.toBeInTheDocument();
    });

    it('shows error toast when add fails', async () => {
      mocks.mockPost.mockRejectedValue(new Error('network error'));
      const { user } = setup([]);
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.add' }));
      await user.type(screen.getByLabelText('loyaltyPrograms.programName'), 'Avianca');
      await user.type(screen.getByLabelText('loyaltyPrograms.memberId'), 'AV999');
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.save' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('loyaltyPrograms.saveError'),
      );
    });
  });

  describe('editing a program', () => {
    it('shows inline edit form when Edit is clicked', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'loyaltyPrograms.edit' });
      await user.click(editButtons[0]!);
      expect(screen.getByDisplayValue('LifeMiles')).toBeInTheDocument();
    });

    it('pre-fills edit form with existing values', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'loyaltyPrograms.edit' });
      await user.click(editButtons[0]!);
      expect(screen.getByLabelText('loyaltyPrograms.programName')).toHaveValue('LifeMiles');
      expect(screen.getByLabelText('loyaltyPrograms.memberId')).toHaveValue('LM123');
    });

    it('calls PATCH on save', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'loyaltyPrograms.edit' });
      await user.click(editButtons[0]!);
      const nameInput = screen.getByLabelText('loyaltyPrograms.programName');
      await user.clear(nameInput);
      await user.type(nameInput, 'LifeMiles Updated');
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.save' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/loyalty-programs/prog-1', {
          programName: 'LifeMiles Updated',
          memberId: 'LM123',
          notes: 'Gold tier',
        }),
      );
    });

    it('shows success toast after update', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'loyaltyPrograms.edit' });
      await user.click(editButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.save' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('loyaltyPrograms.updateSuccess'),
      );
    });

    it('cancels edit form when Cancel is clicked', async () => {
      const { user } = setup();
      const editButtons = screen.getAllByRole('button', { name: 'loyaltyPrograms.edit' });
      await user.click(editButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.cancel' }));
      expect(screen.queryByDisplayValue('LifeMiles')).not.toBeInTheDocument();
    });
  });

  describe('deleting a program', () => {
    it('requires a second click to confirm delete', async () => {
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', { name: 'loyaltyPrograms.delete' });
      await user.click(deleteButtons[0]!);
      expect(mocks.mockDelete).not.toHaveBeenCalled();
      expect(
        screen.getByRole('button', { name: 'loyaltyPrograms.deleteConfirm' }),
      ).toBeInTheDocument();
    });

    it('calls DELETE after confirmation click', async () => {
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', { name: 'loyaltyPrograms.delete' });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockDelete).toHaveBeenCalledWith('/v1/users/me/loyalty-programs/prog-1'),
      );
    });

    it('calls onRefresh after delete', async () => {
      const { user, onRefresh } = setup();
      const deleteButtons = screen.getAllByRole('button', { name: 'loyaltyPrograms.delete' });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.deleteConfirm' }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });

    it('shows success toast after delete', async () => {
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', { name: 'loyaltyPrograms.delete' });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('loyaltyPrograms.deleteSuccess'),
      );
    });

    it('shows error toast when delete fails', async () => {
      mocks.mockDelete.mockRejectedValue(new Error('network error'));
      const { user } = setup();
      const deleteButtons = screen.getAllByRole('button', { name: 'loyaltyPrograms.delete' });
      await user.click(deleteButtons[0]!);
      await user.click(screen.getByRole('button', { name: 'loyaltyPrograms.deleteConfirm' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('loyaltyPrograms.saveError'),
      );
    });
  });
});

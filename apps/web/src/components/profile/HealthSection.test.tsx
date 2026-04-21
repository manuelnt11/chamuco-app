import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
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

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.ComponentProps<'input'>) => <input {...props} />,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.ComponentProps<'textarea'>) => <textarea {...props} />,
}));

vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <span data-testid="spinner" />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: (props: React.ComponentProps<'button'>) => <button {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.ComponentProps<'label'>) => (
    <label {...props}>{children}</label>
  ),
}));

import { HealthSection } from './HealthSection';
import type { HealthData } from './HealthSection';
import { DietaryPreference } from '@chamuco/shared-types';

const baseHealth: HealthData = {
  dietaryPreference: null,
  dietaryNotes: null,
  generalMedicalNotes: null,
  foodAllergies: [],
  phobias: [],
  physicalLimitations: [],
  medicalConditions: [],
};

function setup(healthOverride?: Partial<HealthData>) {
  const onRefresh = vi.fn();
  const user = userEvent.setup();
  render(<HealthSection health={{ ...baseHealth, ...healthOverride }} onRefresh={onRefresh} />);
  return { user, onRefresh };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockPatch.mockResolvedValue({});
});

describe('HealthSection', () => {
  describe('rendering', () => {
    it('renders the section heading', () => {
      setup();
      expect(screen.getByText('health.heading')).toBeInTheDocument();
    });

    it('renders privacy note', () => {
      setup();
      expect(screen.getByText('health.privacyNote')).toBeInTheDocument();
    });

    it('renders all dietary preference buttons', () => {
      setup();
      const buttons = screen.getAllByRole('button', { name: /health\.dietaryPreference\./i });
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders dietary preference OTHER button', () => {
      setup();
      expect(
        screen.getByRole('button', { name: 'health.dietaryPreference.OTHER' }),
      ).toBeInTheDocument();
    });

    it('renders food allergy pills', () => {
      setup();
      expect(screen.getByTestId('foodAllergies-pill-GLUTEN')).toBeInTheDocument();
      expect(screen.getByTestId('foodAllergies-pill-PEANUTS')).toBeInTheDocument();
      expect(screen.getByTestId('foodAllergies-pill-OTHER')).toBeInTheDocument();
    });

    it('renders general medical notes textarea', () => {
      setup();
      expect(screen.getByLabelText('health.generalMedicalNotes.label')).toBeInTheDocument();
    });

    it('does not show dietary notes textarea when preference is not OTHER', () => {
      setup();
      expect(screen.queryByLabelText('health.dietaryNotes.label')).not.toBeInTheDocument();
    });

    it('shows dietary notes textarea when preference is OTHER', () => {
      setup({ dietaryPreference: DietaryPreference.OTHER });
      expect(screen.getByLabelText('health.dietaryNotes.label')).toBeInTheDocument();
    });

    it('populates dietary preference button as pressed when set', () => {
      setup({ dietaryPreference: DietaryPreference.VEGAN });
      expect(
        screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }),
      ).toHaveAttribute('aria-pressed', 'true');
    });

    it('populates general medical notes from initial data', () => {
      setup({ generalMedicalNotes: 'some notes' });
      expect(screen.getByLabelText('health.generalMedicalNotes.label')).toHaveValue('some notes');
    });

    it('renders selected pill for initial food allergy', () => {
      setup({ foodAllergies: [{ allergen: 'GLUTEN' as never, description: null }] });
      expect(screen.getByTestId('foodAllergies-pill-GLUTEN')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('does not show OTHER description input when OTHER is not selected', () => {
      setup();
      expect(screen.queryByTestId('foodAllergies-description-OTHER')).not.toBeInTheDocument();
    });
  });

  describe('save button state', () => {
    it('disables save button when form is pristine', () => {
      setup();
      expect(screen.getByRole('button', { name: 'health.save' })).toBeDisabled();
    });

    it('enables save button after selecting a dietary preference', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }));
      expect(screen.getByRole('button', { name: /health\.save|health\.saving/ })).toBeEnabled();
    });

    it('shows unsaved indicator after making a change', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }));
      expect(screen.getByTestId('unsaved-indicator')).toBeInTheDocument();
    });

    it('hides unsaved indicator on pristine form', () => {
      setup();
      expect(screen.queryByTestId('unsaved-indicator')).not.toBeInTheDocument();
    });

    it('enables save after toggling a food allergy pill', async () => {
      const { user } = setup();
      await user.click(screen.getByTestId('foodAllergies-pill-GLUTEN'));
      expect(screen.getByRole('button', { name: /health\.save|health\.saving/ })).toBeEnabled();
    });

    it('enables save after editing general medical notes', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText('health.generalMedicalNotes.label'), 'note');
      expect(screen.getByRole('button', { name: /health\.save|health\.saving/ })).toBeEnabled();
    });

    it('deselects dietary preference when clicking active button', async () => {
      const { user } = setup({ dietaryPreference: DietaryPreference.VEGAN });
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }));
      expect(
        screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }),
      ).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('dietary notes visibility', () => {
    it('shows dietary notes textarea when OTHER is selected', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.OTHER' }));
      expect(screen.getByLabelText('health.dietaryNotes.label')).toBeInTheDocument();
    });

    it('hides dietary notes textarea when switching away from OTHER', async () => {
      const { user } = setup({ dietaryPreference: DietaryPreference.OTHER });
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }));
      expect(screen.queryByLabelText('health.dietaryNotes.label')).not.toBeInTheDocument();
    });
  });

  describe('health array picklist', () => {
    it('clicking a pill marks it as selected', async () => {
      const { user } = setup();
      await user.click(screen.getByTestId('foodAllergies-pill-EGGS'));
      expect(screen.getByTestId('foodAllergies-pill-EGGS')).toHaveAttribute('aria-pressed', 'true');
    });

    it('clicking a selected pill deselects it', async () => {
      const { user } = setup({
        foodAllergies: [{ allergen: 'EGGS' as never, description: null }],
      });
      await user.click(screen.getByTestId('foodAllergies-pill-EGGS'));
      expect(screen.getByTestId('foodAllergies-pill-EGGS')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('selecting OTHER shows description input', async () => {
      const { user } = setup();
      await user.click(screen.getByTestId('foodAllergies-pill-OTHER'));
      expect(screen.getByTestId('foodAllergies-description-OTHER')).toBeInTheDocument();
    });

    it('deselecting OTHER hides description input', async () => {
      const { user } = setup({
        foodAllergies: [{ allergen: 'OTHER' as never, description: 'custom' }],
      });
      await user.click(screen.getByTestId('foodAllergies-pill-OTHER'));
      expect(screen.queryByTestId('foodAllergies-description-OTHER')).not.toBeInTheDocument();
    });

    it('typing in OTHER description updates its value', async () => {
      const { user } = setup();
      await user.click(screen.getByTestId('foodAllergies-pill-OTHER'));
      await user.type(screen.getByTestId('foodAllergies-description-OTHER'), 'latex allergy');
      expect(screen.getByTestId('foodAllergies-description-OTHER')).toHaveValue('latex allergy');
    });
  });

  describe('validation', () => {
    it('blocks save and shows error when OTHER food allergy has no description', async () => {
      const { user } = setup();
      await user.click(screen.getByTestId('foodAllergies-pill-OTHER'));
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() => {
        expect(screen.getByText('health.arrayField.otherDescriptionRequired')).toBeInTheDocument();
      });
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('allows save when OTHER food allergy has a description', async () => {
      const { user } = setup();
      await user.click(screen.getByTestId('foodAllergies-pill-OTHER'));
      await user.type(screen.getByTestId('foodAllergies-description-OTHER'), 'custom allergy');
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() => expect(mocks.mockPatch).toHaveBeenCalled());
    });
  });

  describe('saving', () => {
    it('calls PATCH /v1/users/me/health on submit', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }));
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({ dietaryPreference: DietaryPreference.VEGAN }),
        ),
      );
    });

    it('sends correct full payload', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }));
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/health', {
          dietaryPreference: DietaryPreference.VEGAN,
          dietaryNotes: null,
          generalMedicalNotes: null,
          foodAllergies: [],
          phobias: [],
          physicalLimitations: [],
          medicalConditions: [],
        }),
      );
    });

    it('sends selected food allergy with null description in payload', async () => {
      const { user } = setup();
      await user.click(screen.getByTestId('foodAllergies-pill-GLUTEN'));
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({
            foodAllergies: [{ allergen: 'GLUTEN', description: null }],
          }),
        ),
      );
    });

    it('sends OTHER food allergy with description in payload', async () => {
      const { user } = setup();
      await user.click(screen.getByTestId('foodAllergies-pill-OTHER'));
      await user.type(screen.getByTestId('foodAllergies-description-OTHER'), 'latex');
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({
            foodAllergies: [{ allergen: 'OTHER', description: 'latex' }],
          }),
        ),
      );
    });

    it('calls onRefresh after successful save', async () => {
      const { user, onRefresh } = setup();
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }));
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });

    it('shows success toast on save', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }));
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockToastSuccess).toHaveBeenCalledWith('health.saveSuccess'),
      );
    });

    it('shows error toast when save fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('network error'));
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }));
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() => expect(mocks.mockToastError).toHaveBeenCalledWith('health.saveError'));
    });

    it('disables save button while saving', async () => {
      mocks.mockPatch.mockImplementation(() => new Promise(() => {}));
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }));
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      expect(screen.getByRole('button', { name: /health\.saving/ })).toBeDisabled();
    });

    it('sends null for dietaryNotes when dietaryPreference is not OTHER', async () => {
      const { user } = setup({ dietaryNotes: 'old notes' });
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.VEGAN' }));
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({ dietaryNotes: null }),
        ),
      );
    });

    it('sends selected phobia in payload', async () => {
      const { user } = setup();
      await user.click(screen.getByTestId('phobias-pill-HEIGHTS'));
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({
            phobias: [{ phobia: 'HEIGHTS', description: null }],
          }),
        ),
      );
    });

    it('sends selected physical limitation in payload', async () => {
      const { user } = setup();
      await user.click(screen.getByTestId('physicalLimitations-pill-CHRONIC_PAIN'));
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({
            physicalLimitations: [{ limitation: 'CHRONIC_PAIN', description: null }],
          }),
        ),
      );
    });

    it('sends selected medical condition in payload', async () => {
      const { user } = setup();
      await user.click(screen.getByTestId('medicalConditions-pill-ASTHMA'));
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({
            medicalConditions: [{ condition: 'ASTHMA', description: null }],
          }),
        ),
      );
    });

    it('sends dietary notes when preference is OTHER', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button', { name: 'health.dietaryPreference.OTHER' }));
      await user.type(screen.getByLabelText('health.dietaryNotes.label'), 'no spicy food');
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({ dietaryNotes: 'no spicy food' }),
        ),
      );
    });
  });
});

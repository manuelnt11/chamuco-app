import { type ComponentProps, type ReactNode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPatch: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: ComponentProps<'input'>) => <input {...props} />,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: ComponentProps<'textarea'>) => <textarea {...props} />,
}));

vi.mock('@/components/ui/select', () => ({
  Select: (props: ComponentProps<'select'>) => <select {...props} />,
}));

vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <span data-testid="spinner" />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: (props: ComponentProps<'button'>) => <button {...props} />,
  buttonVariants: () => 'button',
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: ComponentProps<'label'>) => <label {...props}>{children}</label>,
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({
    render: renderProp,
    children,
    disabled,
  }: {
    render: ReactNode;
    children: ReactNode;
    disabled?: boolean;
  }) => {
    const trigger = renderProp as { props: { 'data-testid'?: string; className?: string } };
    return (
      <div
        role="button"
        tabIndex={0}
        data-testid={trigger.props['data-testid']}
        aria-disabled={disabled}
        className={trigger.props.className}
      >
        {children}
      </div>
    );
  },
  PopoverContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
}));

vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandSearch: (props: ComponentProps<'input'>) => <input role="searchbox" {...props} />,
  CommandItems: ({ children }: { children: ReactNode }) => <div role="listbox">{children}</div>,
  CommandNoResults: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandGroupSection: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandOption: ({
    children,
    onSelect,
    value: _value,
    ...props
  }: {
    children: ReactNode;
    onSelect: () => void;
    value: string;
    // Forwards whatever data-testid/aria-* the real CommandOption call sites pass through.
    [key: string]: unknown;
  }) => (
    <div role="option" onClick={onSelect} {...props}>
      {children}
    </div>
  ),
}));

import { HealthSection } from './HealthSection';
import type { HealthData } from '@/services/users.types';
import { BloodType, DietaryPreference, FoodAllergen } from '@chamuco/shared-types';
import { toast } from '@/components/ui/toast';

const baseHealth: HealthData = {
  bloodType: null,
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

async function selectArrayOption(
  user: ReturnType<typeof userEvent.setup>,
  fieldId: string,
  code: string,
) {
  await user.click(screen.getByTestId(fieldId));
  await user.click(screen.getByTestId(`${fieldId}-option-${code}`));
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

    it('renders blood type select with all options', () => {
      setup();
      const select = screen.getByTestId('bloodType-select');
      expect(select).toBeInTheDocument();
      expect(within(select).getByText('health.bloodType.A_POSITIVE')).toBeInTheDocument();
      expect(within(select).getByText('health.bloodType.O_NEGATIVE')).toBeInTheDocument();
    });

    it('marks blood type select value when set', () => {
      setup({ bloodType: BloodType.O_POSITIVE });
      expect(screen.getByTestId('bloodType-select')).toHaveValue(BloodType.O_POSITIVE);
    });

    it('renders dietary preference select with all options', () => {
      setup();
      const select = screen.getByTestId('dietaryPreference-select');
      for (const value of Object.values(DietaryPreference)) {
        expect(within(select).getByText(`health.dietaryPreference.${value}`)).toBeInTheDocument();
      }
    });

    it('renders every food allergy option in the multi-select', async () => {
      const { user } = setup();
      await user.click(screen.getByTestId('foodAllergies'));
      for (const value of Object.values(FoodAllergen)) {
        expect(screen.getByTestId(`foodAllergies-option-${value}`)).toBeInTheDocument();
      }
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

    it('populates dietary preference select as selected value', () => {
      setup({ dietaryPreference: DietaryPreference.VEGAN });
      expect(screen.getByTestId('dietaryPreference-select')).toHaveValue(DietaryPreference.VEGAN);
    });

    it('populates general medical notes from initial data', () => {
      setup({ generalMedicalNotes: 'some notes' });
      expect(screen.getByLabelText('health.generalMedicalNotes.label')).toHaveValue('some notes');
    });

    it('renders selected chip for initial food allergy', () => {
      setup({ foodAllergies: [{ allergen: 'GLUTEN' as never, description: null }] });
      expect(screen.getByTestId('foodAllergies-chip-GLUTEN')).toBeInTheDocument();
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
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.VEGAN,
      );
      expect(screen.getByRole('button', { name: /health\.save|health\.saving/ })).toBeEnabled();
    });

    it('enables save after selecting a blood type', async () => {
      const { user } = setup();
      await user.selectOptions(screen.getByTestId('bloodType-select'), BloodType.B_POSITIVE);
      expect(screen.getByRole('button', { name: /health\.save|health\.saving/ })).toBeEnabled();
    });

    it('shows unsaved indicator after making a change', async () => {
      const { user } = setup();
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.VEGAN,
      );
      expect(screen.getByTestId('unsaved-indicator')).toBeInTheDocument();
    });

    it('hides unsaved indicator on pristine form', () => {
      setup();
      expect(screen.queryByTestId('unsaved-indicator')).not.toBeInTheDocument();
    });

    it('enables save after toggling a food allergy option', async () => {
      const { user } = setup();
      await selectArrayOption(user, 'foodAllergies', 'GLUTEN');
      expect(screen.getByRole('button', { name: /health\.save|health\.saving/ })).toBeEnabled();
    });

    it('enables save after editing general medical notes', async () => {
      const { user } = setup();
      await user.type(screen.getByLabelText('health.generalMedicalNotes.label'), 'note');
      expect(screen.getByRole('button', { name: /health\.save|health\.saving/ })).toBeEnabled();
    });

    it('deselects dietary preference when selecting the empty option', async () => {
      const { user } = setup({ dietaryPreference: DietaryPreference.VEGAN });
      await user.selectOptions(screen.getByTestId('dietaryPreference-select'), '');
      expect(screen.getByTestId('dietaryPreference-select')).toHaveValue('');
    });
  });

  describe('dietary notes visibility', () => {
    it('shows dietary notes textarea when OTHER is selected', async () => {
      const { user } = setup();
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.OTHER,
      );
      expect(screen.getByLabelText('health.dietaryNotes.label')).toBeInTheDocument();
    });

    it('hides dietary notes textarea when switching away from OTHER', async () => {
      const { user } = setup({ dietaryPreference: DietaryPreference.OTHER });
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.VEGAN,
      );
      expect(screen.queryByLabelText('health.dietaryNotes.label')).not.toBeInTheDocument();
    });
  });

  describe('health array multi-select', () => {
    it('selecting an option marks it with a chip', async () => {
      const { user } = setup();
      await selectArrayOption(user, 'foodAllergies', 'EGGS');
      expect(screen.getByTestId('foodAllergies-chip-EGGS')).toBeInTheDocument();
    });

    it('clicking an already-selected option in the dropdown deselects it', async () => {
      const { user } = setup({
        foodAllergies: [{ allergen: 'EGGS' as never, description: null }],
      });
      await selectArrayOption(user, 'foodAllergies', 'EGGS');
      expect(screen.queryByTestId('foodAllergies-chip-EGGS')).not.toBeInTheDocument();
    });

    it('removing a chip deselects it', async () => {
      const { user } = setup({
        foodAllergies: [{ allergen: 'EGGS' as never, description: null }],
      });
      const chip = screen.getByTestId('foodAllergies-chip-EGGS');
      await user.click(within(chip).getByRole('button'));
      expect(screen.queryByTestId('foodAllergies-chip-EGGS')).not.toBeInTheDocument();
    });

    it('selecting OTHER shows description input', async () => {
      const { user } = setup();
      await selectArrayOption(user, 'foodAllergies', 'OTHER');
      expect(screen.getByTestId('foodAllergies-description-OTHER')).toBeInTheDocument();
    });

    it('removing the OTHER chip hides description input', async () => {
      const { user } = setup({
        foodAllergies: [{ allergen: 'OTHER' as never, description: 'custom' }],
      });
      const chip = screen.getByTestId('foodAllergies-chip-OTHER');
      await user.click(within(chip).getByRole('button'));
      expect(screen.queryByTestId('foodAllergies-description-OTHER')).not.toBeInTheDocument();
    });

    it('typing in OTHER description updates its value', async () => {
      const { user } = setup();
      await selectArrayOption(user, 'foodAllergies', 'OTHER');
      await user.type(screen.getByTestId('foodAllergies-description-OTHER'), 'latex allergy');
      expect(screen.getByTestId('foodAllergies-description-OTHER')).toHaveValue('latex allergy');
    });
  });

  describe('validation', () => {
    it('blocks save and shows error when OTHER food allergy has no description', async () => {
      const { user } = setup();
      await selectArrayOption(user, 'foodAllergies', 'OTHER');
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() => {
        expect(screen.getByText('health.arrayField.otherDescriptionRequired')).toBeInTheDocument();
      });
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('allows save when OTHER food allergy has a description', async () => {
      const { user } = setup();
      await selectArrayOption(user, 'foodAllergies', 'OTHER');
      await user.type(screen.getByTestId('foodAllergies-description-OTHER'), 'custom allergy');
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() => expect(mocks.mockPatch).toHaveBeenCalled());
    });

    it('blocks save and shows error when OTHER phobia has no description', async () => {
      const { user } = setup();
      await selectArrayOption(user, 'phobias', 'OTHER');
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() => {
        expect(screen.getByText('health.arrayField.otherDescriptionRequired')).toBeInTheDocument();
      });
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });

    it('form is pristine after successful save and refresh with updated health prop', async () => {
      const onRefresh = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(
        <HealthSection health={{ ...baseHealth }} onRefresh={onRefresh} />,
      );
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.VEGAN,
      );
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() => expect(vi.mocked(toast.success)).toHaveBeenCalled());

      rerender(
        <HealthSection
          health={{ ...baseHealth, dietaryPreference: DietaryPreference.VEGAN }}
          onRefresh={onRefresh}
        />,
      );
      expect(screen.queryByTestId('unsaved-indicator')).not.toBeInTheDocument();
    });
  });

  describe('saving', () => {
    it('calls PATCH /v1/users/me/health on submit', async () => {
      const { user } = setup();
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.VEGAN,
      );
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
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.VEGAN,
      );
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/health', {
          bloodType: null,
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

    it('sends selected blood type in payload', async () => {
      const { user } = setup();
      await user.selectOptions(screen.getByTestId('bloodType-select'), BloodType.O_POSITIVE);
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({ bloodType: BloodType.O_POSITIVE }),
        ),
      );
    });

    it('clears blood type when empty option is selected', async () => {
      const { user } = setup({ bloodType: BloodType.A_NEGATIVE });
      await user.selectOptions(screen.getByTestId('bloodType-select'), '');
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({ bloodType: null }),
        ),
      );
    });

    it('sends selected food allergy with null description in payload', async () => {
      const { user } = setup();
      await selectArrayOption(user, 'foodAllergies', 'GLUTEN');
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
      await selectArrayOption(user, 'foodAllergies', 'OTHER');
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
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.VEGAN,
      );
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });

    it('shows success toast on save', async () => {
      const { user } = setup();
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.VEGAN,
      );
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith('health.saveSuccess'),
      );
    });

    it('shows error toast when save fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('network error'));
      const { user } = setup();
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.VEGAN,
      );
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalledWith('health.saveError'));
    });

    it('disables save button while saving', async () => {
      mocks.mockPatch.mockImplementation(() => new Promise(() => {}));
      const { user } = setup();
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.VEGAN,
      );
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      expect(screen.getByRole('button', { name: /health\.save/ })).toBeDisabled();
    });

    it('marks the food allergies trigger as aria-disabled while saving', async () => {
      mocks.mockPatch.mockImplementation(() => new Promise(() => {}));
      const { user } = setup();
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.VEGAN,
      );
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      expect(screen.getByTestId('foodAllergies')).toHaveAttribute('aria-disabled', 'true');
    });

    it('sends null for dietaryNotes when dietaryPreference is not OTHER', async () => {
      const { user } = setup({ dietaryNotes: 'old notes' });
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.VEGAN,
      );
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
      await selectArrayOption(user, 'phobias', 'HEIGHTS');
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
      await selectArrayOption(user, 'physicalLimitations', 'CHRONIC_PAIN');
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
      await selectArrayOption(user, 'medicalConditions', 'ASTHMA');
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
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.OTHER,
      );
      await user.type(screen.getByLabelText('health.dietaryNotes.label'), 'no spicy food');
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({ dietaryNotes: 'no spicy food' }),
        ),
      );
    });

    it('sends null for dietaryNotes when preference is OTHER but notes textarea is empty', async () => {
      const { user } = setup({ dietaryPreference: null, dietaryNotes: null });
      await user.selectOptions(
        screen.getByTestId('dietaryPreference-select'),
        DietaryPreference.OTHER,
      );
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({ dietaryNotes: null }),
        ),
      );
    });
  });

  describe('initializing with pre-populated data', () => {
    it('marks pre-populated food allergy with a chip', () => {
      setup({ foodAllergies: [{ allergen: 'GLUTEN' as never, description: null }] });
      expect(screen.getByTestId('foodAllergies-chip-GLUTEN')).toBeInTheDocument();
    });

    it('marks pre-populated phobia with a chip', () => {
      setup({ phobias: [{ phobia: 'HEIGHTS' as never, description: null }] });
      expect(screen.getByTestId('phobias-chip-HEIGHTS')).toBeInTheDocument();
    });

    it('marks pre-populated physical limitation with a chip', () => {
      setup({
        physicalLimitations: [{ limitation: 'CHRONIC_PAIN' as never, description: null }],
      });
      expect(screen.getByTestId('physicalLimitations-chip-CHRONIC_PAIN')).toBeInTheDocument();
    });

    it('marks pre-populated medical condition with a chip', () => {
      setup({ medicalConditions: [{ condition: 'ASTHMA' as never, description: null }] });
      expect(screen.getByTestId('medicalConditions-chip-ASTHMA')).toBeInTheDocument();
    });

    it('shows description input when pre-populated OTHER food allergy exists', () => {
      setup({
        foodAllergies: [{ allergen: 'OTHER' as never, description: 'existing allergy' }],
      });
      expect(screen.getByTestId('foodAllergies-description-OTHER')).toHaveValue('existing allergy');
    });

    it('updating description on pre-populated OTHER item triggers onChange', async () => {
      const { user } = setup({
        foodAllergies: [{ allergen: 'OTHER' as never, description: 'existing' }],
      });
      const descInput = screen.getByTestId('foodAllergies-description-OTHER');
      await user.clear(descInput);
      await user.type(descInput, 'updated allergy');
      await user.click(screen.getByRole('button', { name: /health\.save/ }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/users/me/health',
          expect.objectContaining({
            foodAllergies: [{ allergen: 'OTHER', description: 'updated allergy' }],
          }),
        ),
      );
    });
  });
});

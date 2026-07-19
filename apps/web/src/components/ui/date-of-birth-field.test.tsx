import { type ComponentProps } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/components/ui/button', () => ({
  Button: (props: ComponentProps<'button'>) => <button {...props} />,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: ComponentProps<'input'>) => <input {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: (props: ComponentProps<'label'>) => <label {...props} />,
}));

vi.mock('@/components/ui/field-message', () => ({
  FieldMessage: ({ error, className }: { error?: string | null; className?: string }) =>
    error ? (
      <p className={className} role="alert">
        {error}
      </p>
    ) : null,
}));

import { DateOfBirthField } from './date-of-birth-field';
import type { DateOfBirthFieldProps } from './date-of-birth-field';

const defaultProps: DateOfBirthFieldProps = {
  day: '15',
  month: '6',
  year: '1990',
  onDayChange: vi.fn(),
  onMonthChange: vi.fn(),
  onYearChange: vi.fn(),
  groupLabel: 'Date of Birth',
  dayLabel: 'Day',
  monthLabel: 'Month',
  yearLabel: 'Year',
  calendarAriaLabel: 'Open date picker',
};

function setup(overrides?: Partial<DateOfBirthFieldProps>) {
  const props = { ...defaultProps, ...overrides };
  const user = userEvent.setup();
  render(<DateOfBirthField {...props} />);
  return { user, props };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DateOfBirthField', () => {
  describe('rendering', () => {
    it('renders day input with correct value', () => {
      setup();
      expect(screen.getByTestId('dob-day-input')).toHaveValue(15);
    });

    it('renders month input with correct value', () => {
      setup();
      expect(screen.getByTestId('dob-month-input')).toHaveValue(6);
    });

    it('renders year input with correct value', () => {
      setup();
      expect(screen.getByTestId('dob-year-input')).toHaveValue(1990);
    });

    it('renders calendar button with aria-label', () => {
      setup();
      expect(screen.getByRole('button', { name: 'Open date picker' })).toBeInTheDocument();
    });

    it('does not render error when error is null', () => {
      setup({ error: null });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders error message when error prop is set', () => {
      setup({ error: 'Invalid date of birth' });
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid date of birth');
    });

    it('sets aria-invalid on inputs when error is set', () => {
      setup({ error: 'Invalid date' });
      expect(screen.getByTestId('dob-day-input')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByTestId('dob-month-input')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByTestId('dob-year-input')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid on inputs when error is null', () => {
      setup({ error: null });
      expect(screen.getByTestId('dob-day-input')).toHaveAttribute('aria-invalid', 'false');
    });

    it('disables all inputs and calendar button when disabled=true', () => {
      setup({ disabled: true });
      expect(screen.getByTestId('dob-day-input')).toBeDisabled();
      expect(screen.getByTestId('dob-month-input')).toBeDisabled();
      expect(screen.getByTestId('dob-year-input')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Open date picker' })).toBeDisabled();
    });

    it('associates labels with inputs via htmlFor', () => {
      setup();
      expect(screen.getByLabelText('Day')).toBe(screen.getByTestId('dob-day-input'));
      expect(screen.getByLabelText('Month')).toBe(screen.getByTestId('dob-month-input'));
      expect(screen.getByLabelText('Year')).toBe(screen.getByTestId('dob-year-input'));
    });
  });

  describe('hidden date input value', () => {
    it('sets hidden input to YYYY-MM-DD when values are valid', () => {
      setup({ day: '5', month: '3', year: '1985' });
      const hiddenInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      expect(hiddenInput.value).toBe('1985-03-05');
    });

    it('sets hidden input to empty string when day is empty', () => {
      setup({ day: '' });
      const hiddenInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      expect(hiddenInput.value).toBe('');
    });

    it('pads single-digit month and day with leading zero', () => {
      setup({ day: '1', month: '1', year: '2000' });
      const hiddenInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      expect(hiddenInput.value).toBe('2000-01-01');
    });
  });

  describe('individual input changes', () => {
    it('calls onDayChange when day input changes', async () => {
      const onDayChange = vi.fn();
      const { user } = setup({ onDayChange });
      await user.clear(screen.getByTestId('dob-day-input'));
      await user.type(screen.getByTestId('dob-day-input'), '20');
      expect(onDayChange).toHaveBeenCalled();
    });

    it('calls onMonthChange when month input changes', async () => {
      const onMonthChange = vi.fn();
      const { user } = setup({ onMonthChange });
      await user.clear(screen.getByTestId('dob-month-input'));
      await user.type(screen.getByTestId('dob-month-input'), '12');
      expect(onMonthChange).toHaveBeenCalled();
    });

    it('calls onYearChange when year input changes', async () => {
      const onYearChange = vi.fn();
      const { user } = setup({ onYearChange });
      await user.clear(screen.getByTestId('dob-year-input'));
      await user.type(screen.getByTestId('dob-year-input'), '1985');
      expect(onYearChange).toHaveBeenCalled();
    });
  });

  describe('calendar picker', () => {
    it('calls showPicker on hidden input when calendar button is clicked', async () => {
      const { user } = setup();
      const hiddenInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      const showPicker = vi.fn();
      Object.defineProperty(hiddenInput, 'showPicker', { value: showPicker, configurable: true });
      await user.click(screen.getByRole('button', { name: 'Open date picker' }));
      expect(showPicker).toHaveBeenCalledOnce();
    });

    it('does not throw when showPicker is not available', async () => {
      const { user } = setup();
      // No showPicker defined — should silently no-op
      await expect(
        user.click(screen.getByRole('button', { name: 'Open date picker' })),
      ).resolves.not.toThrow();
    });

    it('fills day/month/year when date is selected via hidden input', () => {
      const onDayChange = vi.fn();
      const onMonthChange = vi.fn();
      const onYearChange = vi.fn();
      setup({ onDayChange, onMonthChange, onYearChange });
      const hiddenInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(hiddenInput, { target: { value: '1985-11-03' } });
      expect(onDayChange).toHaveBeenCalledWith('3');
      expect(onMonthChange).toHaveBeenCalledWith('11');
      expect(onYearChange).toHaveBeenCalledWith('1985');
    });

    it('ignores empty value from hidden input', () => {
      const onDayChange = vi.fn();
      setup({ onDayChange });
      const hiddenInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(hiddenInput, { target: { value: '' } });
      expect(onDayChange).not.toHaveBeenCalled();
    });
  });

  describe('toYear prop', () => {
    it('sets max attribute on year input', () => {
      setup({ toYear: 2005 });
      expect(screen.getByTestId('dob-year-input')).toHaveAttribute('max', '2005');
    });

    it('sets max on hidden date input', () => {
      setup({ toYear: 2005 });
      const hiddenInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      expect(hiddenInput.max).toBe('2005-12-31');
    });
  });

  describe('fieldMessageClassName', () => {
    it('passes className to field message', () => {
      setup({ error: 'Error', fieldMessageClassName: 'text-xs' });
      expect(screen.getByRole('alert')).toHaveClass('text-xs');
    });
  });

  describe('groupLabel', () => {
    it('renders fieldset with legend for the group label', () => {
      setup({ groupLabel: 'Date of Birth' });
      expect(screen.getByRole('group', { name: 'Date of Birth' })).toBeInTheDocument();
    });
  });
});

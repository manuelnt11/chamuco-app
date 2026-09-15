import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LoyaltyProgramCombobox } from './loyalty-program-combobox';

function ControlledLoyaltyProgramCombobox({
  initialValue = '',
  onChange,
}: {
  initialValue?: string;
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <LoyaltyProgramCombobox
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
      data-testid="program"
    />
  );
}

function setup(value = '', onChange = vi.fn()) {
  const user = userEvent.setup();
  render(<ControlledLoyaltyProgramCombobox initialValue={value} onChange={onChange} />);
  return { user, onChange };
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('LoyaltyProgramCombobox', () => {
  describe('rendering', () => {
    it('shows a placeholder when value is empty', () => {
      setup();
      expect(screen.getByText('loyaltyPrograms.programName')).toBeInTheDocument();
    });

    it('reflects the value prop in the trigger', () => {
      setup('Delta SkyMiles');
      expect(screen.getByText('Delta SkyMiles')).toBeInTheDocument();
    });

    it('passes id to the trigger', () => {
      render(<LoyaltyProgramCombobox id="program-name" value="" onChange={vi.fn()} />);
      expect(document.getElementById('program-name')).toBeInTheDocument();
    });

    it('disables the trigger when disabled is set', () => {
      render(<LoyaltyProgramCombobox value="" onChange={vi.fn()} disabled data-testid="program" />);
      expect(screen.getByTestId('program')).toBeDisabled();
    });
  });

  describe('suggestions', () => {
    it('shows matching suggestions after typing', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button'));
      await user.type(screen.getByPlaceholderText('loyaltyPrograms.programName'), 'Delta');
      expect(screen.getByText('Delta SkyMiles')).toBeInTheDocument();
    });

    it('shows category label alongside a suggestion', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button'));
      await user.type(screen.getByPlaceholderText('loyaltyPrograms.programName'), 'Delta');
      expect(screen.getByText('loyaltyPrograms.categories.airline')).toBeInTheDocument();
    });

    it('shows the no-results hint when the query has no matches', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button'));
      await user.type(screen.getByPlaceholderText('loyaltyPrograms.programName'), 'zzznonexistent');
      expect(screen.getByText('loyaltyPrograms.noResults')).toBeInTheDocument();
    });

    it('limits results to 8 suggestions', async () => {
      const { user } = setup();
      await user.click(screen.getByRole('button'));
      // "a" matches more than 8 programs so the cap is always exercised
      await user.type(screen.getByPlaceholderText('loyaltyPrograms.programName'), 'a');
      expect(screen.getAllByRole('option')).toHaveLength(8);
    });
  });

  describe('selection', () => {
    it('calls onChange with the suggestion name when selected and closes the popover', async () => {
      const { user, onChange } = setup();
      await user.click(screen.getByRole('button'));
      await user.type(screen.getByPlaceholderText('loyaltyPrograms.programName'), 'Delta');
      await user.click(screen.getByText('Delta SkyMiles'));
      expect(onChange).toHaveBeenCalledWith('Delta SkyMiles');
      expect(screen.queryByRole('option')).not.toBeInTheDocument();
    });

    it('calls onChange on every keystroke', async () => {
      const { user, onChange } = setup();
      await user.click(screen.getByRole('button'));
      await user.type(screen.getByPlaceholderText('loyaltyPrograms.programName'), 'Life');
      expect(onChange).toHaveBeenCalledTimes(4);
      expect(onChange).toHaveBeenLastCalledWith('Life');
    });
  });

  describe('external value sync', () => {
    it('updates the trigger when value prop changes via rerender', () => {
      const { rerender } = render(
        <LoyaltyProgramCombobox value="Delta SkyMiles" onChange={vi.fn()} />,
      );
      expect(screen.getByText('Delta SkyMiles')).toBeInTheDocument();
      rerender(<LoyaltyProgramCombobox value="Marriott Bonvoy" onChange={vi.fn()} />);
      expect(screen.getByText('Marriott Bonvoy')).toBeInTheDocument();
    });
  });
});

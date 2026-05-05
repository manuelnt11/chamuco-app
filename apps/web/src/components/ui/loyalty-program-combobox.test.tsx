import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.ComponentProps<'input'>) => <input {...props} />,
}));

import { LoyaltyProgramCombobox } from './loyalty-program-combobox';

function setup(value = '', onChange = vi.fn()) {
  const user = userEvent.setup();
  render(<LoyaltyProgramCombobox value={value} onChange={onChange} />);
  return { user, onChange, input: screen.getByRole('textbox') };
}

describe('LoyaltyProgramCombobox', () => {
  describe('rendering', () => {
    it('renders an input', () => {
      setup();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('reflects the value prop', () => {
      setup('Delta SkyMiles');
      expect(screen.getByRole('textbox')).toHaveValue('Delta SkyMiles');
    });

    it('passes required to the input', () => {
      render(<LoyaltyProgramCombobox value="" onChange={vi.fn()} required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('passes maxLength to the input', () => {
      render(<LoyaltyProgramCombobox value="" onChange={vi.fn()} maxLength={100} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '100');
    });

    it('passes disabled to the input', () => {
      render(<LoyaltyProgramCombobox value="" onChange={vi.fn()} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('passes id to the input', () => {
      render(<LoyaltyProgramCombobox id="program-name" value="" onChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'program-name');
    });
  });

  describe('dropdown visibility', () => {
    it('shows no dropdown when value is empty', () => {
      setup('');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('shows dropdown when value matches suggestions', async () => {
      const { user, input } = setup('');
      await user.type(input, 'Delta');
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('shows matching suggestion in the dropdown', async () => {
      const { user, input } = setup('');
      await user.type(input, 'Delta');
      expect(screen.getByText('Delta SkyMiles')).toBeInTheDocument();
    });

    it('shows category label alongside suggestion', async () => {
      const { user, input } = setup('');
      await user.type(input, 'Delta');
      // category key rendered via t() mock as-is: "loyaltyPrograms.categories.airline"
      expect(screen.getByText('loyaltyPrograms.categories.airline')).toBeInTheDocument();
    });

    it('shows no dropdown when query has no matches', async () => {
      const { user, input } = setup('');
      await user.type(input, 'zzznonexistent');
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('limits results to 8 suggestions', async () => {
      const { user, input } = setup('');
      // "a" matches many programs
      await user.type(input, 'a');
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeLessThanOrEqual(8);
    });

    it('hides dropdown after blur', async () => {
      const { user, input } = setup('');
      await user.type(input, 'Delta');
      expect(screen.getByRole('list')).toBeInTheDocument();
      fireEvent.blur(input);
      // dropdown closes after 150ms timeout
      await new Promise((r) => setTimeout(r, 200));
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('calls onChange with suggestion name when selected', async () => {
      const onChange = vi.fn();
      render(<LoyaltyProgramCombobox value="" onChange={onChange} />);
      const user = userEvent.setup();
      const input = screen.getByRole('textbox');

      await user.type(input, 'Delta');
      const button = screen.getByRole('button', { name: /Delta SkyMiles/ });
      fireEvent.mouseDown(button);

      expect(onChange).toHaveBeenCalledWith('Delta SkyMiles');
    });

    it('calls onChange on every keystroke', async () => {
      const onChange = vi.fn();
      render(<LoyaltyProgramCombobox value="" onChange={onChange} />);
      const user = userEvent.setup();
      await user.type(screen.getByRole('textbox'), 'Life');
      expect(onChange).toHaveBeenCalledTimes(4);
    });

    it('calls onChange with empty string when input is cleared', async () => {
      const onChange = vi.fn();
      render(<LoyaltyProgramCombobox value="LifeMiles" onChange={onChange} />);
      const user = userEvent.setup();
      await user.clear(screen.getByRole('textbox'));
      expect(onChange).toHaveBeenLastCalledWith('');
    });
  });
});

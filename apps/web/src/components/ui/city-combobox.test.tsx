import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockUseCitySearch: vi.fn(),
}));

vi.mock('@/hooks/useCitySearch', () => ({
  useCitySearch: mocks.mockUseCitySearch,
}));

import { CityCombobox } from './city-combobox';

function setup(props: Partial<Parameters<typeof CityCombobox>[0]> = {}) {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <CityCombobox
      value=""
      onChange={onChange}
      country="CO"
      data-testid="city-combobox"
      {...props}
    />,
  );
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
  mocks.mockUseCitySearch.mockReturnValue({ results: [], isLoading: false });
});

describe('CityCombobox', () => {
  it('shows the country placeholder when country is set and value is empty', () => {
    setup();
    expect(screen.getByText('cityCombobox.placeholder')).toBeInTheDocument();
  });

  it('shows the select-country-first placeholder when country is empty', () => {
    setup({ country: '' });
    expect(screen.getByText('cityCombobox.selectCountryFirst')).toBeInTheDocument();
  });

  it('shows the current value in the trigger', () => {
    setup({ value: 'BOGOTA' });
    expect(screen.getByText('BOGOTA')).toBeInTheDocument();
  });

  it('shows a hint to type at least 2 characters below that threshold', async () => {
    const { user } = setup();
    await user.click(screen.getByTestId('city-combobox'));
    expect(screen.getByText('cityCombobox.typeToSearch')).toBeInTheDocument();
  });

  it('shows a loading spinner while searching', async () => {
    mocks.mockUseCitySearch.mockReturnValue({ results: [], isLoading: true });
    const { user } = setup();
    await user.click(screen.getByTestId('city-combobox'));
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows no-results text when loaded with zero matches', async () => {
    mocks.mockUseCitySearch.mockReturnValue({ results: [], isLoading: false });
    const { user } = setup();
    await user.click(screen.getByTestId('city-combobox'));
    await user.type(screen.getByPlaceholderText('cityCombobox.placeholder'), 'zz');
    expect(screen.getByText('cityCombobox.noResults')).toBeInTheDocument();
  });

  it('renders each result with its name and region', async () => {
    mocks.mockUseCitySearch.mockReturnValue({
      results: [{ name: 'Medellin', region: 'Antioquia' }],
      isLoading: false,
    });
    const { user } = setup();
    await user.click(screen.getByTestId('city-combobox'));
    expect(screen.getByText('Medellin')).toBeInTheDocument();
    expect(screen.getByText('Antioquia')).toBeInTheDocument();
  });

  it('does not call onChange while typing without selecting a result', async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByTestId('city-combobox'));
    await user.type(screen.getByPlaceholderText('cityCombobox.placeholder'), 'm');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange with empty string when the search is cleared', async () => {
    const { user, onChange } = setup({ value: 'BOGOTA' });
    await user.click(screen.getByTestId('city-combobox'));
    await user.clear(screen.getByPlaceholderText('cityCombobox.placeholder'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('selecting a result calls onChange with its uppercased name and closes the popover', async () => {
    mocks.mockUseCitySearch.mockReturnValue({
      results: [{ name: 'Medellin', region: 'Antioquia' }],
      isLoading: false,
    });
    const { user, onChange } = setup();
    await user.click(screen.getByTestId('city-combobox'));
    await user.click(screen.getByText('Medellin'));
    expect(onChange).toHaveBeenCalledWith('MEDELLIN');
    expect(screen.queryByText('Antioquia')).not.toBeInTheDocument();
  });
});

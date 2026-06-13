import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/components/trips/TripForm', () => ({
  TripForm: ({ mode, onSuccess }: { mode: string; onSuccess: (trip: { id: string }) => void }) => (
    <div data-testid="trip-form" data-mode={mode}>
      <button onClick={() => onSuccess({ id: 'new-trip-uuid' })}>submit</button>
    </div>
  ),
}));

import NewTripPage from './page';

describe('NewTripPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders the page title and form in create mode', () => {
    render(<NewTripPage />);
    expect(screen.getByText('form.createTitle')).toBeInTheDocument();
    expect(screen.getByTestId('trip-form')).toHaveAttribute('data-mode', 'create');
  });

  it('navigates to the new trip on success', async () => {
    const user = userEvent.setup();
    render(<NewTripPage />);
    await user.click(screen.getByRole('button', { name: 'submit' }));
    expect(mockPush).toHaveBeenCalledWith('/trips/new-trip-uuid');
  });
});

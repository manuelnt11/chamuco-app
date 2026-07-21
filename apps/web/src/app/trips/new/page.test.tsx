import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/services/users.service', () => ({
  getMyProfile: vi.fn().mockResolvedValue({
    homeCountry: 'CO',
    homeCity: 'Bogotá',
  }),
}));

vi.mock('@/components/trips/TripForm', () => ({
  TripForm: ({
    mode,
    initialValues,
    onSuccess,
  }: {
    mode: string;
    initialValues?: { departureCountry?: string; departureCity?: string };
    onSuccess: (trip: { id: string }) => void;
  }) => (
    <div
      data-testid="trip-form"
      data-mode={mode}
      data-departure-country={initialValues?.departureCountry}
      data-departure-city={initialValues?.departureCity}
    >
      <button onClick={() => onSuccess({ id: 'new-trip-uuid' })}>submit</button>
    </div>
  ),
}));

import NewTripPage from './page';

describe('NewTripPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders the page title and form in create mode', async () => {
    render(<NewTripPage />);
    expect(screen.getByText('form.createTitle')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('trip-form')).toHaveAttribute('data-mode', 'create'),
    );
  });

  it('pre-fills departure from user home country and city', async () => {
    render(<NewTripPage />);
    await waitFor(() => {
      expect(screen.getByTestId('trip-form')).toHaveAttribute('data-departure-country', 'CO');
      expect(screen.getByTestId('trip-form')).toHaveAttribute('data-departure-city', 'Bogotá');
    });
  });

  it('navigates to the new trip on success', async () => {
    const user = userEvent.setup();
    render(<NewTripPage />);
    await waitFor(() => screen.getByRole('button', { name: 'submit' }));
    await user.click(screen.getByRole('button', { name: 'submit' }));
    expect(mockPush).toHaveBeenCalledWith('/trips/new-trip-uuid');
  });
});

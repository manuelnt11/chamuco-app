import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DestinationResponse, DestinationWriteResponse } from '@/services/trips.types';

// ─── Hoisted mocks ───────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  addTripDestination: vi.fn(),
  updateTripDestination: vi.fn(),
  deleteTripDestination: vi.fn(),
  reorderTripDestinations: vi.fn(),
  toastError: vi.fn(),
  onDragEnd: null as
    | ((event: { active: { id: string }; over: { id: string } | null }) => void)
    | null,
}));

vi.mock('@/services/trips.service', () => ({
  addTripDestination: mocks.addTripDestination,
  updateTripDestination: mocks.updateTripDestination,
  deleteTripDestination: mocks.deleteTripDestination,
  reorderTripDestinations: mocks.reorderTripDestinations,
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { error: mocks.toastError },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/ui/country-combobox', () => ({
  CountryCombobox: ({ value, onChange }: { value: string; onChange: (iso2: string) => void }) => (
    <select data-testid="country-combobox" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">—</option>
      <option value="MX">Mexico</option>
      <option value="CO">Colombia</option>
    </select>
  ),
}));

vi.mock('@/components/ui/city-combobox', () => ({
  CityCombobox: ({ value, onChange }: { value: string; onChange: (city: string) => void }) => (
    <input data-testid="city-combobox" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

// Minimal @dnd-kit mocks: SortableContext/useSortable render children as-is;
// DndContext captures onDragEnd so tests can trigger reorders programmatically.
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd?: (event: { active: { id: string }; over: { id: string } | null }) => void;
  }) => {
    mocks.onDragEnd = onDragEnd ?? null;
    return <>{children}</>;
  },
  PointerSensor: class {},
  KeyboardSensor: class {},
  closestCenter: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: (opts: { id: string }) => ({
    attributes: { 'data-id': opts.id },
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: <T,>(arr: T[], from: number, to: number): T[] => {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    return next;
  },
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}));

// ─── Import component after mocks ────────────────────────────────────────────

import { DestinationList } from './DestinationList';
import type React from 'react';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeDestination(overrides: Partial<DestinationResponse> = {}): DestinationResponse {
  return {
    id: 'dest-1',
    tripId: 'trip-1',
    position: 1,
    countryCode: 'MX',
    city: 'Cancun',
    label: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const destA = makeDestination({ id: 'dest-a', position: 1, city: 'Cancun' });
const destB = makeDestination({ id: 'dest-b', position: 2, city: 'Tulum', countryCode: 'MX' });

const writeResponse = (d: DestinationResponse): DestinationWriteResponse => ({
  ...d,
  requiresConfirmation: false,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mocks.onDragEnd = null;
});

describe('DestinationList', () => {
  describe('fixed departure and landing items', () => {
    it('renders departure city in participant mode', () => {
      render(
        <DestinationList
          tripId="trip-1"
          initialDestinations={[]}
          isOrganizer={false}
          departureCity="Mexico City"
          departureCountry="MX"
          landingCity="Bogota"
          landingCountry="CO"
        />,
      );
      expect(screen.getByText(/Mexico City/)).toBeInTheDocument();
    });

    it('renders landing city in participant mode', () => {
      render(
        <DestinationList
          tripId="trip-1"
          initialDestinations={[]}
          isOrganizer={false}
          departureCity="Mexico City"
          departureCountry="MX"
          landingCity="Bogota"
          landingCountry="CO"
        />,
      );
      expect(screen.getByText(/Bogota/)).toBeInTheDocument();
    });

    it('renders departure and landing labels', () => {
      render(
        <DestinationList
          tripId="trip-1"
          initialDestinations={[]}
          isOrganizer={false}
          departureCity="Mexico City"
          departureCountry="MX"
          landingCity="Bogota"
          landingCountry="CO"
        />,
      );
      expect(screen.getByText('form.departureLocation')).toBeInTheDocument();
      expect(screen.getByText('form.landingLocation')).toBeInTheDocument();
    });

    it('renders departure and landing in organizer mode', () => {
      render(
        <DestinationList
          tripId="trip-1"
          initialDestinations={[]}
          isOrganizer={true}
          departureCity="Mexico City"
          departureCountry="MX"
          landingCity="Bogota"
          landingCountry="CO"
        />,
      );
      expect(screen.getByText(/Mexico City/)).toBeInTheDocument();
      expect(screen.getByText(/Bogota/)).toBeInTheDocument();
    });
  });

  describe('read-only (participant) mode', () => {
    it('renders ordered destination list', () => {
      render(
        <DestinationList
          tripId="trip-1"
          initialDestinations={[destA, destB]}
          isOrganizer={false}
          departureCity="Bogota"
          departureCountry="CO"
          landingCity="Bogota"
          landingCountry="CO"
        />,
      );
      expect(screen.getByText(/Cancun/)).toBeInTheDocument();
      expect(screen.getByText(/Tulum/)).toBeInTheDocument();
    });

    it('renders position numbers', () => {
      render(
        <DestinationList
          tripId="trip-1"
          initialDestinations={[destA, destB]}
          isOrganizer={false}
          departureCity="Bogota"
          departureCountry="CO"
          landingCity="Bogota"
          landingCountry="CO"
        />,
      );
      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('2.')).toBeInTheDocument();
    });

    it('renders label when present', () => {
      const dest = makeDestination({ label: 'Beach stop' });
      render(
        <DestinationList
          tripId="trip-1"
          initialDestinations={[dest]}
          isOrganizer={false}
          departureCity="Bogota"
          departureCountry="CO"
          landingCity="Bogota"
          landingCountry="CO"
        />,
      );
      expect(screen.getByText(/Beach stop/)).toBeInTheDocument();
    });

    it('shows empty state when no destinations', () => {
      render(
        <DestinationList
          tripId="trip-1"
          initialDestinations={[]}
          isOrganizer={false}
          departureCity="Bogota"
          departureCountry="CO"
          landingCity="Bogota"
          landingCountry="CO"
        />,
      );
      expect(screen.getByText('detail.noDestinations')).toBeInTheDocument();
    });

    it('does not show add button', () => {
      render(
        <DestinationList
          tripId="trip-1"
          initialDestinations={[destA]}
          isOrganizer={false}
          departureCity="Bogota"
          departureCountry="CO"
          landingCity="Bogota"
          landingCountry="CO"
        />,
      );
      expect(screen.queryByLabelText('destinations.addButton')).not.toBeInTheDocument();
    });

    it('does not show edit/delete actions', () => {
      render(
        <DestinationList
          tripId="trip-1"
          initialDestinations={[destA]}
          isOrganizer={false}
          departureCity="Bogota"
          departureCountry="CO"
          landingCity="Bogota"
          landingCountry="CO"
        />,
      );
      expect(screen.queryByLabelText('actions.edit')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('actions.delete')).not.toBeInTheDocument();
    });
  });

  describe('organizer mode', () => {
    it('shows add button', () => {
      render(
        <DestinationList
          tripId="trip-1"
          initialDestinations={[]}
          isOrganizer={true}
          departureCity="Bogota"
          departureCountry="CO"
          landingCity="Bogota"
          landingCountry="CO"
        />,
      );
      expect(screen.getByLabelText('destinations.addButton')).toBeInTheDocument();
    });

    it('shows edit and delete actions per item', () => {
      render(
        <DestinationList
          tripId="trip-1"
          initialDestinations={[destA]}
          isOrganizer={true}
          departureCity="Bogota"
          departureCountry="CO"
          landingCity="Bogota"
          landingCountry="CO"
        />,
      );
      expect(screen.getByTitle('actions.edit')).toBeInTheDocument();
      expect(screen.getByTitle('actions.delete')).toBeInTheDocument();
    });

    describe('add flow', () => {
      it('opens add dialog on button click', async () => {
        const user = userEvent.setup();
        render(
          <DestinationList
            tripId="trip-1"
            initialDestinations={[]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );
        await user.click(screen.getByLabelText('destinations.addButton'));
        expect(screen.getByText('destinations.addTitle')).toBeInTheDocument();
      });

      it('calls addTripDestination and updates list on submit', async () => {
        const user = userEvent.setup();
        const newDest = makeDestination({ id: 'dest-new', city: 'Oaxaca', countryCode: 'MX' });
        mocks.addTripDestination.mockResolvedValueOnce(writeResponse(newDest));

        render(
          <DestinationList
            tripId="trip-1"
            initialDestinations={[]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        await user.click(screen.getByLabelText('destinations.addButton'));
        await user.selectOptions(screen.getByTestId('country-combobox'), 'MX');
        await user.clear(screen.getByTestId('city-combobox'));
        await user.type(screen.getByTestId('city-combobox'), 'Oaxaca');
        await user.click(screen.getByRole('button', { name: 'common:actions.save' }));

        await waitFor(() => {
          expect(mocks.addTripDestination).toHaveBeenCalledWith('trip-1', {
            countryCode: 'MX',
            city: 'Oaxaca',
            label: undefined,
          });
        });

        expect(screen.getByText(/Oaxaca/)).toBeInTheDocument();
      });

      it('shows error toast when addTripDestination fails', async () => {
        const user = userEvent.setup();
        mocks.addTripDestination.mockRejectedValueOnce(new Error('network'));

        render(
          <DestinationList
            tripId="trip-1"
            initialDestinations={[]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        await user.click(screen.getByLabelText('destinations.addButton'));
        await user.selectOptions(screen.getByTestId('country-combobox'), 'MX');
        await user.type(screen.getByTestId('city-combobox'), 'Oaxaca');
        await user.click(screen.getByRole('button', { name: 'common:actions.save' }));

        await waitFor(() => {
          expect(mocks.toastError).toHaveBeenCalledWith('destinations.saveError');
        });
      });
    });

    describe('edit flow', () => {
      it('opens edit dialog pre-filled with destination data', async () => {
        const user = userEvent.setup();
        render(
          <DestinationList
            tripId="trip-1"
            initialDestinations={[destA]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );
        await user.click(screen.getByTitle('actions.edit'));
        expect(screen.getByText('destinations.editTitle')).toBeInTheDocument();
        expect((screen.getByTestId('country-combobox') as HTMLSelectElement).value).toBe('MX');
        expect((screen.getByTestId('city-combobox') as HTMLInputElement).value).toBe('Cancun');
      });

      it('calls updateTripDestination and updates list on submit', async () => {
        const user = userEvent.setup();
        const updated = { ...destA, city: 'Merida' };
        mocks.updateTripDestination.mockResolvedValueOnce(writeResponse(updated));

        render(
          <DestinationList
            tripId="trip-1"
            initialDestinations={[destA]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        await user.click(screen.getByTitle('actions.edit'));
        await user.clear(screen.getByTestId('city-combobox'));
        await user.type(screen.getByTestId('city-combobox'), 'Merida');
        await user.click(screen.getByRole('button', { name: 'common:actions.save' }));

        await waitFor(() => {
          expect(mocks.updateTripDestination).toHaveBeenCalledWith('trip-1', 'dest-a', {
            countryCode: 'MX',
            city: 'Merida',
            label: undefined,
          });
        });

        expect(screen.getByText(/Merida/)).toBeInTheDocument();
      });
    });

    describe('delete flow', () => {
      it('calls deleteTripDestination and removes item on confirm', async () => {
        const user = userEvent.setup();
        mocks.deleteTripDestination.mockResolvedValueOnce(undefined);

        render(
          <DestinationList
            tripId="trip-1"
            initialDestinations={[destA, destB]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        const deleteButtons = screen.getAllByTitle('actions.delete');
        await user.click(deleteButtons[0]!);
        await user.click(screen.getByText('actions.deleteConfirm'));

        await waitFor(() => {
          expect(mocks.deleteTripDestination).toHaveBeenCalledWith('trip-1', 'dest-a');
        });

        expect(screen.queryByText('Cancun')).not.toBeInTheDocument();
      });

      it('reverts and shows error toast when deleteTripDestination fails', async () => {
        const user = userEvent.setup();
        mocks.deleteTripDestination.mockRejectedValueOnce(new Error('network'));

        render(
          <DestinationList
            tripId="trip-1"
            initialDestinations={[destA]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        const deleteButton = screen.getByTitle('actions.delete');
        await user.click(deleteButton);
        await user.click(screen.getByText('actions.deleteConfirm'));

        await waitFor(() => {
          expect(mocks.toastError).toHaveBeenCalledWith('destinations.deleteError');
        });

        expect(screen.getByText(/Cancun/)).toBeInTheDocument();
      });
    });

    describe('reorder flow', () => {
      it('calls reorderTripDestinations after drag end', async () => {
        const reordered = [
          { ...destB, position: 1 },
          { ...destA, position: 2 },
        ];
        mocks.reorderTripDestinations.mockResolvedValueOnce(reordered);

        render(
          <DestinationList
            tripId="trip-1"
            initialDestinations={[destA, destB]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        // Simulate drag end: move dest-a (index 0) to dest-b's position (index 1)
        expect(mocks.onDragEnd).not.toBeNull();
        await mocks.onDragEnd!({ active: { id: 'dest-a' }, over: { id: 'dest-b' } });

        await waitFor(() => {
          expect(mocks.reorderTripDestinations).toHaveBeenCalledWith('trip-1', {
            destinationIds: ['dest-b', 'dest-a'],
          });
        });
      });

      it('reverts and shows error toast when reorderTripDestinations fails', async () => {
        mocks.reorderTripDestinations.mockRejectedValueOnce(new Error('network'));

        render(
          <DestinationList
            tripId="trip-1"
            initialDestinations={[destA, destB]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        await mocks.onDragEnd!({ active: { id: 'dest-a' }, over: { id: 'dest-b' } });

        await waitFor(() => {
          expect(mocks.toastError).toHaveBeenCalledWith('destinations.reorderError');
        });

        // Cancun should still be in position 1 after rollback
        expect(screen.getByText(/Cancun/)).toBeInTheDocument();
      });

      it('does nothing when dragged to same position', async () => {
        render(
          <DestinationList
            tripId="trip-1"
            initialDestinations={[destA, destB]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        await mocks.onDragEnd!({ active: { id: 'dest-a' }, over: { id: 'dest-a' } });
        expect(mocks.reorderTripDestinations).not.toHaveBeenCalled();
      });

      it('does nothing when dropped outside a valid target', async () => {
        render(
          <DestinationList
            tripId="trip-1"
            initialDestinations={[destA, destB]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        await mocks.onDragEnd!({ active: { id: 'dest-a' }, over: null });
        expect(mocks.reorderTripDestinations).not.toHaveBeenCalled();
      });
    });
  });
});

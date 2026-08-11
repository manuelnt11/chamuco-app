import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DestinationResponse, DestinationWriteResponse } from '@/services/trips.types';

// ─── Hoisted mocks ───────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  addTripDestination: vi.fn(),
  updateTripDestination: vi.fn(),
  deleteTripDestination: vi.fn(),
  reorderTripDestinations: vi.fn(),
  onDragEnd: null as
    ((event: { active: { id: string }; over: { id: string } | null }) => void) | null,
}));

vi.mock('@/services/trips.service', () => ({
  addTripDestination: mocks.addTripDestination,
  updateTripDestination: mocks.updateTripDestination,
  deleteTripDestination: mocks.deleteTripDestination,
  reorderTripDestinations: mocks.reorderTripDestinations,
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

vi.mock('@/components/ui/markdown-content', () => ({
  MarkdownContent: ({ content }: { content: string }) => (
    <div data-testid="markdown-content">{content}</div>
  ),
}));

vi.mock('@/components/ui/rich-text-editor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// ─── Import component after mocks ────────────────────────────────────────────

import { TripDestinationList } from './TripDestinationList';
import type React from 'react';
import { toast } from '@/components/ui/toast';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeDestination(overrides: Partial<DestinationResponse> = {}): DestinationResponse {
  return {
    id: 'dest-1',
    tripId: 'trip-1',
    position: 1,
    countryCode: 'MX',
    city: 'Cancun',
    label: null,
    itinerary: null,
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

describe('TripDestinationList', () => {
  describe('fixed departure and landing items', () => {
    it('renders departure city in participant mode', () => {
      render(
        <TripDestinationList
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
        <TripDestinationList
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
        <TripDestinationList
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
        <TripDestinationList
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
        <TripDestinationList
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
        <TripDestinationList
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
        <TripDestinationList
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
        <TripDestinationList
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
        <TripDestinationList
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
        <TripDestinationList
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

    describe('itinerary expand', () => {
      it('itinerary panel hidden by default', () => {
        render(
          <TripDestinationList
            tripId="trip-1"
            initialDestinations={[destA]}
            isOrganizer={false}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );
        expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument();
        expect(screen.queryByText('destinations.noItinerary')).not.toBeInTheDocument();
      });

      it('shows noItinerary when expanded and itinerary is null', async () => {
        const user = userEvent.setup();
        render(
          <TripDestinationList
            tripId="trip-1"
            initialDestinations={[destA]}
            isOrganizer={false}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );
        await user.click(screen.getByRole('button', { expanded: false }));
        expect(screen.getByText('destinations.noItinerary')).toBeInTheDocument();
      });

      it('renders itinerary content when expanded and itinerary is set', async () => {
        const user = userEvent.setup();
        const dest = makeDestination({ itinerary: '## Day 1\n\nBeach time' });
        render(
          <TripDestinationList
            tripId="trip-1"
            initialDestinations={[dest]}
            isOrganizer={false}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );
        await user.click(screen.getByRole('button', { expanded: false }));
        expect(screen.getByTestId('markdown-content')).toHaveTextContent('## Day 1');
      });

      it('collapses panel on second click', async () => {
        const user = userEvent.setup();
        render(
          <TripDestinationList
            tripId="trip-1"
            initialDestinations={[destA]}
            isOrganizer={false}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );
        const btn = screen.getByRole('button', { expanded: false });
        await user.click(btn);
        expect(screen.getByText('destinations.noItinerary')).toBeInTheDocument();
        await user.click(btn);
        expect(screen.queryByText('destinations.noItinerary')).not.toBeInTheDocument();
      });
    });
  });

  describe('organizer mode', () => {
    it('shows add button', () => {
      render(
        <TripDestinationList
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
        <TripDestinationList
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
          <TripDestinationList
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
          <TripDestinationList
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
          <TripDestinationList
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
          expect(vi.mocked(toast.error)).toHaveBeenCalledWith('destinations.saveError');
        });
      });
    });

    describe('edit flow', () => {
      it('opens edit dialog pre-filled with destination data', async () => {
        const user = userEvent.setup();
        render(
          <TripDestinationList
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
          <TripDestinationList
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
          <TripDestinationList
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
          <TripDestinationList
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
          expect(vi.mocked(toast.error)).toHaveBeenCalledWith('destinations.deleteError');
        });

        expect(screen.getByText(/Cancun/)).toBeInTheDocument();
      });

      it('shows deleteLastError toast when only one destination remains', async () => {
        const user = userEvent.setup();

        render(
          <TripDestinationList
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
          expect(vi.mocked(toast.error)).toHaveBeenCalledWith('destinations.deleteLastError');
        });

        expect(mocks.deleteTripDestination).not.toHaveBeenCalled();
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
          <TripDestinationList
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
          <TripDestinationList
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
          expect(vi.mocked(toast.error)).toHaveBeenCalledWith('destinations.reorderError');
        });

        // Cancun should still be in position 1 after rollback
        expect(screen.getByText(/Cancun/)).toBeInTheDocument();
      });

      it('does nothing when dragged to same position', async () => {
        render(
          <TripDestinationList
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
          <TripDestinationList
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

    describe('itinerary expand (organizer)', () => {
      it('itinerary panel hidden by default', () => {
        render(
          <TripDestinationList
            tripId="trip-1"
            initialDestinations={[destA]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );
        expect(screen.queryByText('destinations.noItinerary')).not.toBeInTheDocument();
      });

      it('shows noItinerary when expanded and itinerary is null', async () => {
        const user = userEvent.setup();
        render(
          <TripDestinationList
            tripId="trip-1"
            initialDestinations={[destA]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );
        await user.click(screen.getByLabelText('destinations.toggleItinerary'));
        expect(screen.getByText('destinations.noItinerary')).toBeInTheDocument();
      });

      it('renders itinerary content when expanded', async () => {
        const user = userEvent.setup();
        const dest = makeDestination({ itinerary: '## Day 1\n\nBeach time' });
        render(
          <TripDestinationList
            tripId="trip-1"
            initialDestinations={[dest]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );
        await user.click(screen.getByLabelText('destinations.toggleItinerary'));
        expect(screen.getByTestId('markdown-content')).toHaveTextContent('## Day 1');
      });

      it('shows edit button on hover and opens editor on click', async () => {
        const user = userEvent.setup();
        render(
          <TripDestinationList
            tripId="trip-1"
            initialDestinations={[destA]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );
        await user.click(screen.getByLabelText('destinations.toggleItinerary'));
        await user.click(screen.getByLabelText('destinations.editItinerary'));
        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      });

      it('calls updateTripDestination and updates list on save', async () => {
        const user = userEvent.setup();
        const dest = makeDestination({ itinerary: null });
        const updated: DestinationResponse = { ...dest, itinerary: '## Day 1' };
        mocks.updateTripDestination.mockResolvedValueOnce({
          ...updated,
          requiresConfirmation: false,
        });

        render(
          <TripDestinationList
            tripId="trip-1"
            initialDestinations={[dest]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        await user.click(screen.getByLabelText('destinations.toggleItinerary'));
        await user.click(screen.getByLabelText('destinations.editItinerary'));
        await user.clear(screen.getByTestId('rich-text-editor'));
        await user.type(screen.getByTestId('rich-text-editor'), '## Day 1');
        await user.click(screen.getByRole('button', { name: 'common:actions.save' }));

        await waitFor(() => {
          expect(mocks.updateTripDestination).toHaveBeenCalledWith('trip-1', dest.id, {
            itinerary: '## Day 1',
          });
        });

        expect(screen.queryByTestId('rich-text-editor')).not.toBeInTheDocument();
        expect(screen.getByTestId('markdown-content')).toHaveTextContent('## Day 1');
      });

      it('sends null when editor is cleared to clear itinerary', async () => {
        const user = userEvent.setup();
        const dest = makeDestination({ itinerary: '## Existing' });
        const cleared: DestinationResponse = { ...dest, itinerary: null };
        mocks.updateTripDestination.mockResolvedValueOnce({
          ...cleared,
          requiresConfirmation: false,
        });

        render(
          <TripDestinationList
            tripId="trip-1"
            initialDestinations={[dest]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        await user.click(screen.getByLabelText('destinations.toggleItinerary'));
        await user.click(screen.getByLabelText('destinations.editItinerary'));
        await user.clear(screen.getByTestId('rich-text-editor'));
        await user.click(screen.getByRole('button', { name: 'common:actions.save' }));

        await waitFor(() => {
          expect(mocks.updateTripDestination).toHaveBeenCalledWith('trip-1', dest.id, {
            itinerary: null,
          });
        });

        expect(screen.getByText('destinations.noItinerary')).toBeInTheDocument();
      });

      it('shows error toast when updateTripDestination fails', async () => {
        const user = userEvent.setup();
        mocks.updateTripDestination.mockRejectedValueOnce(new Error('network'));

        render(
          <TripDestinationList
            tripId="trip-1"
            initialDestinations={[destA]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        await user.click(screen.getByLabelText('destinations.toggleItinerary'));
        await user.click(screen.getByLabelText('destinations.editItinerary'));
        await user.click(screen.getByRole('button', { name: 'common:actions.save' }));

        await waitFor(() => {
          expect(vi.mocked(toast.error)).toHaveBeenCalledWith('destinations.saveError');
        });

        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      });

      it('cancel dismisses editor without saving', async () => {
        const user = userEvent.setup();
        render(
          <TripDestinationList
            tripId="trip-1"
            initialDestinations={[destA]}
            isOrganizer={true}
            departureCity="Bogota"
            departureCountry="CO"
            landingCity="Bogota"
            landingCountry="CO"
          />,
        );

        await user.click(screen.getByLabelText('destinations.toggleItinerary'));
        await user.click(screen.getByLabelText('destinations.editItinerary'));
        await user.click(screen.getByRole('button', { name: 'common:actions.cancel' }));

        expect(screen.queryByTestId('rich-text-editor')).not.toBeInTheDocument();
        expect(mocks.updateTripDestination).not.toHaveBeenCalled();
      });
    });
  });
});

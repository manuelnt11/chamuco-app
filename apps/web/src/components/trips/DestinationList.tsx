'use client';

import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AirplaneLandingIcon,
  AirplaneTakeoffIcon,
  DotsSixVerticalIcon,
  PlusIcon,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountryCombobox } from '@/components/ui/country-combobox';
import { CityCombobox } from '@/components/ui/city-combobox';
import { EditDeleteActions } from '@/components/ui/edit-delete-actions';
import { toast } from '@/components/ui/toast';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  addTripDestination,
  updateTripDestination,
  deleteTripDestination,
  reorderTripDestinations,
} from '@/services/trips.service';
import type { DestinationResponse } from '@/services/trips.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DestinationListProps {
  tripId: string;
  initialDestinations: DestinationResponse[];
  isOrganizer: boolean;
  departureCity: string;
  departureCountry: string;
  landingCity: string;
  landingCountry: string;
}

type FormMode = 'add' | 'edit';

interface FormState {
  mode: FormMode;
  dest: DestinationResponse | null;
}

// ─── SortableItem ────────────────────────────────────────────────────────────

interface SortableItemProps {
  dest: DestinationResponse;
  isSaving: boolean;
  onEdit: (dest: DestinationResponse) => void;
  onDelete: (dest: DestinationResponse) => Promise<void>;
}

function SortableItem({ dest, isSaving, onEdit, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dest.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 hover:border-border"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        disabled={isSaving}
        {...attributes}
        {...listeners}
      >
        <DotsSixVerticalIcon className="size-4" aria-hidden="true" />
      </button>

      <span className="text-muted-foreground tabular-nums w-5 shrink-0 text-right text-sm">
        {dest.position}.
      </span>

      <span className="flex-1 text-sm">
        {dest.city}, {dest.countryCode}
        {dest.label && <span className="ml-1 text-muted-foreground">— {dest.label}</span>}
      </span>

      <EditDeleteActions
        onEdit={() => onEdit(dest)}
        onDelete={() => onDelete(dest)}
        disabled={isSaving}
      />
    </li>
  );
}

// ─── DestinationFormDialog ────────────────────────────────────────────────────

interface DestinationFormDialogProps {
  open: boolean;
  mode: FormMode;
  initial: DestinationResponse | null;
  tripId: string;
  isSaving: boolean;
  onSave: (dest: DestinationResponse) => void;
  onSaveError: () => void;
  onClose: () => void;
  setIsSaving: (v: boolean) => void;
}

function DestinationFormDialog({
  open,
  mode,
  initial,
  tripId,
  isSaving,
  onSave,
  onSaveError,
  onClose,
  setIsSaving,
}: DestinationFormDialogProps) {
  const { t } = useTranslation('trips');

  const [countryCode, setCountryCode] = useState(initial?.countryCode ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');

  // Reset fields when dialog re-opens with new initial values
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setCountryCode(initial?.countryCode ?? '');
    setCity(initial?.city ?? '');
    setLabel(initial?.label ?? '');
  }

  const submitDisabled = isSaving || !countryCode || !city.trim();

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitDisabled) return;
    setIsSaving(true);
    try {
      const dto = { countryCode, city: city.trim(), label: label.trim() || undefined };
      let saved: DestinationResponse;
      if (mode === 'add') {
        const res = await addTripDestination(tripId, dto);
        saved = res;
      } else {
        const res = await updateTripDestination(tripId, initial!.id, dto);
        saved = res;
      }
      onSave(saved);
      onClose();
    } catch {
      onSaveError();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogPopup>
        <DialogClose />
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? t('destinations.addTitle') : t('destinations.editTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>{t('destinations.countryCode')}</Label>
            <CountryCombobox
              value={countryCode}
              onChange={(iso2) => {
                setCountryCode(iso2);
                setCity('');
              }}
              placeholder="—"
              searchPlaceholder={t('common:actions.search')}
              noResultsText={t('common:validation.invalidFormat')}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('destinations.city')}</Label>
            <CityCombobox
              value={city}
              onChange={setCity}
              country={countryCode}
              placeholder={countryCode ? '—' : t('form.cityDisabled')}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('destinations.label')}</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('destinations.labelPlaceholder')}
              maxLength={100}
              disabled={isSaving}
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              {t('common:actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {isSaving ? t('form.saving') : t('common:actions.save')}
            </button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

// ─── DestinationList ──────────────────────────────────────────────────────────

export function DestinationList({
  tripId,
  initialDestinations,
  isOrganizer,
  departureCity,
  departureCountry,
  landingCity,
  landingCountry,
}: DestinationListProps) {
  const { t } = useTranslation('trips');
  const [destinations, setDestinations] = useState<DestinationResponse[]>(initialDestinations);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<FormState | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function openAdd() {
    setFormState({ mode: 'add', dest: null });
  }

  function openEdit(dest: DestinationResponse) {
    setFormState({ mode: 'edit', dest });
  }

  function closeForm() {
    setFormState(null);
  }

  function handleSave(saved: DestinationResponse) {
    setDestinations((prev) => {
      const idx = prev.findIndex((d) => d.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  }

  async function handleDelete(dest: DestinationResponse) {
    const prev = destinations;
    setDestinations((d) => d.filter((x) => x.id !== dest.id));
    try {
      await deleteTripDestination(tripId, dest.id);
    } catch {
      setDestinations(prev);
      toast.error(t('destinations.deleteError'));
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = destinations.findIndex((d) => d.id === active.id);
    const newIndex = destinations.findIndex((d) => d.id === over.id);
    const reordered = arrayMove(destinations, oldIndex, newIndex).map((d, i) => ({
      ...d,
      position: i + 1,
    }));

    const prev = destinations;
    setDestinations(reordered);

    try {
      const result = await reorderTripDestinations(tripId, {
        destinationIds: reordered.map((d) => d.id),
      });
      setDestinations(result);
    } catch {
      setDestinations(prev);
      toast.error(t('destinations.reorderError'));
    }
  }

  if (!isOrganizer) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
          <AirplaneTakeoffIcon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="flex-1">
            {departureCity}, {departureCountry}
          </span>
          <span className="text-xs text-muted-foreground">{t('form.departureLocation')}</span>
        </div>

        {destinations.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">{t('detail.noDestinations')}</p>
        ) : (
          <ol className="space-y-1">
            {destinations.map((dest) => (
              <li key={dest.id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                <span className="text-muted-foreground tabular-nums w-5 shrink-0 text-right">
                  {dest.position}.
                </span>
                <span className="flex-1">
                  {dest.city}, {dest.countryCode}
                  {dest.label && <span className="ml-1 text-muted-foreground">— {dest.label}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
          <AirplaneLandingIcon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="flex-1">
            {landingCity}, {landingCountry}
          </span>
          <span className="text-xs text-muted-foreground">{t('form.landingLocation')}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
          <AirplaneTakeoffIcon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="flex-1">
            {departureCity}, {departureCountry}
          </span>
          <span className="text-xs text-muted-foreground">{t('form.departureLocation')}</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={destinations.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            {destinations.length === 0 ? (
              <p className="px-2 text-sm text-muted-foreground">{t('detail.noDestinations')}</p>
            ) : (
              <ol className="space-y-1">
                {destinations.map((dest) => (
                  <SortableItem
                    key={dest.id}
                    dest={dest}
                    isSaving={isSaving}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </ol>
            )}
          </SortableContext>
        </DndContext>

        <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
          <AirplaneLandingIcon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="flex-1">
            {landingCity}, {landingCountry}
          </span>
          <span className="text-xs text-muted-foreground">{t('form.landingLocation')}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openAdd}
        disabled={isSaving}
        className="mt-3"
        title={t('destinations.addButton')}
        aria-label={t('destinations.addButton')}
      >
        <PlusIcon aria-hidden="true" />
        {t('destinations.addButton')}
      </Button>

      {formState && (
        <DestinationFormDialog
          open={true}
          mode={formState.mode}
          initial={formState.dest}
          tripId={tripId}
          isSaving={isSaving}
          onSave={handleSave}
          onSaveError={() => toast.error(t('destinations.saveError'))}
          onClose={closeForm}
          setIsSaving={setIsSaving}
        />
      )}
    </div>
  );
}

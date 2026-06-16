'use client';

import { useState, useRef, useEffect, type ChangeEvent, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getTwemojiUrl } from '@chamuco/shared-utils';
import { TripVisibility, UploadType } from '@chamuco/shared-types';
import axios from 'axios';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { CountryCombobox } from '@/components/ui/country-combobox';
import { CityCombobox } from '@/components/ui/city-combobox';
import { TimezoneCombobox } from '@/components/ui/timezone-combobox';
import { CropModal } from '@/components/ui/crop-modal';
import { createTrip, updateTrip, addTripGroup } from '@/services/trips.service';
import { getSignedUrl } from '@/services/uploads.service';
import { uploadToGcs } from '@/services/gcs-upload';
import { GroupAutocomplete, type GroupPickerItem } from '@/components/ui/group-autocomplete';
import { AVATAR_EMOJIS } from '@/lib/avatar-emojis';
import type { TripResponse } from '@/services/trips.types';

type CoverTab = 'emoji' | 'photo';

interface TripFormProps {
  mode: 'create' | 'edit';
  tripId?: string;
  initialValues?: {
    name: string;
    description: string | null;
    visibility: TripVisibility;
    startDate: string;
    endDate: string;
    participantCapacity: number;
    departureCountry: string;
    departureCity: string;
    landingCountry: string;
    landingCity: string;
    defaultTimezone: string | null;
    defaultCurrency: string | null;
    isTravelingParticipant?: boolean;
  };
  onSuccess: (trip: TripResponse) => void;
}

export function TripForm({ mode, tripId, initialValues, onSuccess }: TripFormProps) {
  const { t } = useTranslation(['trips', 'common']);

  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [visibility, setVisibility] = useState<TripVisibility>(
    initialValues?.visibility ?? TripVisibility.PUBLIC,
  );
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? '');
  const [endDate, setEndDate] = useState(initialValues?.endDate ?? '');
  const [participantCapacity, setParticipantCapacity] = useState(
    initialValues?.participantCapacity ?? 1,
  );
  const [isTravelingParticipant, setIsTravelingParticipant] = useState(
    initialValues?.isTravelingParticipant ?? true,
  );
  const [departureCountry, setDepartureCountry] = useState(initialValues?.departureCountry ?? '');
  const [departureCity, setDepartureCity] = useState(initialValues?.departureCity ?? '');

  const initialHasDifferentReturn =
    mode === 'edit' &&
    initialValues != null &&
    (initialValues.landingCountry !== initialValues.departureCountry ||
      initialValues.landingCity !== initialValues.departureCity);

  const [hasDifferentReturn, setHasDifferentReturn] = useState(initialHasDifferentReturn);
  const [landingCountry, setLandingCountry] = useState(initialValues?.landingCountry ?? '');
  const [landingCity, setLandingCity] = useState(initialValues?.landingCity ?? '');

  const [defaultTimezone, setDefaultTimezone] = useState(initialValues?.defaultTimezone ?? '');
  const [defaultCurrency, setDefaultCurrency] = useState(initialValues?.defaultCurrency ?? '');
  const [showOptional, setShowOptional] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [linkedGroups, setLinkedGroups] = useState<GroupPickerItem[]>([]);
  const [groupSearchInput, setGroupSearchInput] = useState('');

  const [coverTab, setCoverTab] = useState<CoverTab>('emoji');
  const [selectedEmoji, setSelectedEmoji] = useState(AVATAR_EMOJIS[0] ?? '😀');
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPublicDisabled = mode === 'edit' && initialValues?.visibility === TripVisibility.PRIVATE;

  const endDateError = startDate && endDate && endDate < startDate;

  const submitDisabled =
    isSaving ||
    name.trim().length < 1 ||
    !startDate ||
    !endDate ||
    !!endDateError ||
    participantCapacity < 1 ||
    !departureCountry ||
    !departureCity ||
    (hasDifferentReturn && (!landingCountry || !landingCity)) ||
    (mode === 'create' && coverTab === 'photo' && !croppedBlob);

  useEffect(() => {
    if (!croppedBlob) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(croppedBlob);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [croppedBlob]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCropFile(file);
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitDisabled) return;

    setIsSaving(true);
    try {
      const effectiveLandingCountry = hasDifferentReturn ? landingCountry : departureCountry;
      const effectiveLandingCity = hasDifferentReturn ? landingCity : departureCity;

      if (mode === 'create') {
        let trip = await createTrip({
          name,
          description: description.trim() || undefined,
          visibility,
          startDate,
          endDate,
          participantCapacity,
          departureCountry,
          departureCity,
          landingCountry: effectiveLandingCountry,
          landingCity: effectiveLandingCity,
          defaultTimezone: defaultTimezone || undefined,
          defaultCurrency: defaultCurrency.trim().toUpperCase() || undefined,
          isTravelingParticipant,
          cover: { source: 'emoji', target: selectedEmoji },
        });

        if (coverTab === 'photo' && croppedBlob) {
          try {
            const file = new File([croppedBlob], 'cover.jpg', { type: 'image/jpeg' });
            const signed = await getSignedUrl({
              uploadType: UploadType.TRIP_COVER,
              contextId: trip.id,
              contentType: 'image/jpeg',
              fileSize: croppedBlob.size,
            });
            await uploadToGcs(signed.uploadUrl, file, () => {});
            trip = await updateTrip(trip.id, {
              cover: { source: 'gcs', target: signed.objectKey, fileSize: croppedBlob.size },
            });
          } catch {
            toast.error(t('errors.coverUploadFailed'));
            onSuccess(trip);
            return;
          }
        }

        for (const group of linkedGroups) {
          try {
            await addTripGroup(trip.id, { groupId: group.id });
          } catch {
            // best-effort: group linking failure does not block trip creation
          }
        }

        onSuccess(trip);
      } else {
        const trip = await updateTrip(tripId!, {
          name,
          description: description.trim() || undefined,
          visibility,
          startDate,
          endDate,
          participantCapacity,
          departureCountry,
          departureCity,
          landingCountry: effectiveLandingCountry,
          landingCity: effectiveLandingCity,
          defaultTimezone: defaultTimezone || undefined,
          defaultCurrency: defaultCurrency.trim().toUpperCase() || undefined,
        });
        onSuccess(trip);
      }
    } catch (err) {
      const isCannotMakePublic =
        axios.isAxiosError(err) &&
        err.response?.status === 400 &&
        (err.response.data as { error?: string }).error === 'TRIP_CANNOT_BE_MADE_PUBLIC';
      const isForbidden = axios.isAxiosError(err) && err.response?.status === 403;
      if (isCannotMakePublic) {
        toast.error(t('errors.cannotMakePublic'));
      } else if (isForbidden) {
        toast.error(t('errors.forbidden'));
      } else {
        toast.error(mode === 'create' ? t('errors.createFailed') : t('errors.saveFailed'));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="trip-name">{t('form.name')}</Label>
        <Input
          id="trip-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('form.namePlaceholder')}
          required
          minLength={1}
          maxLength={100}
          disabled={isSaving}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="trip-description">{t('form.description')}</Label>
        <Textarea
          id="trip-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('form.descriptionPlaceholder')}
          maxLength={200}
          disabled={isSaving}
          rows={3}
        />
        <div className="flex justify-end">
          <span
            className={`text-xs ${description.length >= 200 ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {description.length}/200
          </span>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="trip-start-date">{t('form.startDate')}</Label>
          <Input
            id="trip-start-date"
            type="date"
            value={startDate}
            onChange={(e) => {
              const newStart = e.target.value;
              setStartDate(newStart);
              if (newStart && (!endDate || endDate <= newStart)) {
                const d = new Date(newStart);
                if (!isNaN(d.getTime())) {
                  d.setUTCDate(d.getUTCDate() + 1);
                  setEndDate(d.toISOString().slice(0, 10));
                }
              }
            }}
            required
            disabled={isSaving}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trip-end-date">{t('form.endDate')}</Label>
          <Input
            id="trip-end-date"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            required
            disabled={isSaving}
            aria-invalid={!!endDateError}
          />
          {endDateError && <p className="text-xs text-destructive">{t('form.endDateError')}</p>}
        </div>
      </div>

      {/* Capacity + traveling participant */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="trip-capacity">{t('form.participantCapacity')}</Label>
          <Input
            id="trip-capacity"
            type="number"
            value={participantCapacity}
            onChange={(e) => setParticipantCapacity(Number(e.target.value))}
            min={1}
            required
            disabled={isSaving}
            className="w-28"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isTravelingParticipant}
            onChange={(e) => setIsTravelingParticipant(e.target.checked)}
            disabled={isSaving}
            className="size-4"
          />
          <span className="text-sm">{t('form.isTravelingParticipant')}</span>
        </label>
      </div>

      {/* Departure location */}
      <div className="space-y-3">
        <p className="text-sm font-medium">{t('form.departureLocation')}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t('form.country')}</Label>
            <CountryCombobox
              value={departureCountry}
              onChange={(iso2) => {
                setDepartureCountry(iso2);
                setDepartureCity('');
              }}
              placeholder="—"
              searchPlaceholder={t('common:actions.search')}
              noResultsText={t('common:validation.invalidFormat')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('form.city')}</Label>
            <CityCombobox
              value={departureCity}
              onChange={setDepartureCity}
              country={departureCountry}
              placeholder={departureCountry ? '—' : t('form.cityDisabled')}
            />
          </div>
        </div>
      </div>

      {/* Different return location toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={hasDifferentReturn}
          onChange={(e) => {
            setHasDifferentReturn(e.target.checked);
            if (!e.target.checked) {
              setLandingCountry('');
              setLandingCity('');
            }
          }}
          disabled={isSaving}
          className="size-4"
        />
        <span className="text-sm">{t('form.differentReturn')}</span>
      </label>

      {/* Landing location (conditional) */}
      {hasDifferentReturn && (
        <div className="space-y-3">
          <p className="text-sm font-medium">{t('form.landingLocation')}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('form.country')}</Label>
              <CountryCombobox
                value={landingCountry}
                onChange={(iso2) => {
                  setLandingCountry(iso2);
                  setLandingCity('');
                }}
                placeholder="—"
                searchPlaceholder={t('common:actions.search')}
                noResultsText={t('common:validation.invalidFormat')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('form.city')}</Label>
              <CityCombobox
                value={landingCity}
                onChange={setLandingCity}
                country={landingCountry}
                placeholder={landingCountry ? '—' : t('form.cityDisabled')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Linked groups (create only) */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Label>{t('form.linkedGroups')}</Label>
          {linkedGroups.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {linkedGroups.map((g) => (
                <span
                  key={g.id}
                  className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
                >
                  {g.coverUrl && (
                    <img
                      src={g.coverUrl}
                      alt=""
                      className="size-4 rounded-sm object-cover"
                      aria-hidden="true"
                    />
                  )}
                  {g.name}
                  <button
                    type="button"
                    onClick={() => setLinkedGroups((prev) => prev.filter((x) => x.id !== g.id))}
                    className="ml-0.5 rounded-full hover:text-destructive"
                    aria-label={t('form.linkedGroupsRemove', { name: g.name })}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <GroupAutocomplete
            value={groupSearchInput}
            onChange={setGroupSearchInput}
            onSelect={(group) => {
              setLinkedGroups((prev) =>
                prev.some((g) => g.id === group.id) ? prev : [...prev, group],
              );
            }}
            excludedIds={linkedGroups.map((g) => g.id)}
            placeholder={t('form.linkedGroupsPlaceholder')}
            disabled={isSaving}
          />
        </div>
      )}

      {/* Visibility */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t('visibility.label')}</legend>
        {([TripVisibility.PUBLIC, TripVisibility.PRIVATE] as TripVisibility[]).map((v) => {
          const isDisabled = isSaving || (v === TripVisibility.PUBLIC && isPublicDisabled);
          return (
            <label
              key={v}
              title={
                v === TripVisibility.PUBLIC && isPublicDisabled
                  ? t('visibility.public_disabled_tooltip')
                  : undefined
              }
              className={`flex items-start gap-3 rounded-lg border border-border p-3 has-checked:border-primary has-checked:bg-primary/5 ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <input
                type="radio"
                name="visibility"
                value={v}
                checked={visibility === v}
                onChange={() => setVisibility(v)}
                disabled={isDisabled}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">
                  {v === TripVisibility.PUBLIC ? t('visibility.public') : t('visibility.private')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {v === TripVisibility.PUBLIC
                    ? t('visibility.public_desc')
                    : t('visibility.private_desc')}
                </p>
                {mode === 'create' &&
                  v === TripVisibility.PRIVATE &&
                  visibility === TripVisibility.PRIVATE && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      {t('visibility.private_irreversible_hint')}
                    </p>
                  )}
              </div>
            </label>
          );
        })}
      </fieldset>

      {/* Optional section */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span
            className={`transition-transform ${showOptional ? 'rotate-90' : ''}`}
            aria-hidden="true"
          >
            ›
          </span>
          {t('form.optionalSection')}
        </button>

        {showOptional && (
          <div className="space-y-4 pl-4 border-l border-border">
            <div className="space-y-1.5">
              <Label htmlFor="trip-timezone">{t('form.defaultTimezone')}</Label>
              <TimezoneCombobox
                value={defaultTimezone}
                onChange={setDefaultTimezone}
                placeholder={t('form.defaultTimezonePlaceholder')}
                searchPlaceholder={t('common:actions.search')}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trip-currency">{t('form.defaultCurrency')}</Label>
              <Input
                id="trip-currency"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase())}
                placeholder={t('form.defaultCurrencyPlaceholder')}
                maxLength={3}
                disabled={isSaving}
                className="w-28 uppercase"
              />
            </div>
          </div>
        )}
      </div>

      {/* Cover (create mode only) */}
      {mode === 'create' && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('form.cover.label')}</p>

          {cropFile ? (
            <CropModal
              file={cropFile}
              onConfirm={(blob) => {
                setCroppedBlob(blob);
                setCropFile(null);
              }}
              onCancel={() => setCropFile(null)}
              isConfirming={false}
              uploadProgress={0}
              isUploading={false}
              title={t('form.cover.cropTitle')}
              confirmLabel={t('form.cover.usePhoto')}
            />
          ) : (
            <>
              <div className="flex gap-2 border-b">
                {(['emoji', 'photo'] as CoverTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCoverTab(tab)}
                    className={`pb-2 text-sm font-medium transition-colors ${
                      coverTab === tab
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'photo' ? t('form.cover.tabImage') : t('form.cover.tabEmoji')}
                  </button>
                ))}
              </div>

              <div className="mt-3">
                {coverTab === 'photo' && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      aria-hidden="true"
                    />
                    {photoPreviewUrl ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={photoPreviewUrl}
                          alt=""
                          className="size-12 rounded-lg object-cover"
                          aria-hidden="true"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSaving}
                          className="text-sm font-medium underline-offset-2 hover:underline disabled:opacity-50"
                        >
                          {t('form.cover.editButton')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                      >
                        {t('common:upload.chooseFile')}
                      </button>
                    )}
                  </>
                )}

                {coverTab === 'emoji' && (
                  <div className="grid grid-cols-8 gap-2">
                    {AVATAR_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(emoji)}
                        disabled={isSaving}
                        aria-label={emoji}
                        aria-pressed={selectedEmoji === emoji}
                        className={`flex size-10 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                          selectedEmoji === emoji
                            ? 'bg-primary/10 ring-2 ring-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <img
                          src={getTwemojiUrl(emoji)}
                          alt={emoji}
                          className="size-6"
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={submitDisabled}
        className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {isSaving ? t('form.saving') : mode === 'create' ? t('form.submit') : t('form.saveChanges')}
      </button>
    </form>
  );
}

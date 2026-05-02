'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SaveButton } from '@/components/ui/save-button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { FieldMessage } from '@/components/ui/field-message';
import { apiClient } from '@/services/api-client';
import {
  BloodType,
  DietaryPreference,
  FoodAllergen,
  PhobiaType,
  PhysicalLimitationType,
  MedicalConditionType,
} from '@chamuco/shared-types';
import { cn } from '@/lib/utils';

export interface HealthArrayItem {
  code: string;
  description: string;
}

export interface HealthData {
  bloodType: BloodType | null;
  dietaryPreference: DietaryPreference | null;
  dietaryNotes: string | null;
  generalMedicalNotes: string | null;
  foodAllergies: { allergen: FoodAllergen; description: string | null }[];
  phobias: { phobia: PhobiaType; description: string | null }[];
  physicalLimitations: { limitation: PhysicalLimitationType; description: string | null }[];
  medicalConditions: { condition: MedicalConditionType; description: string | null }[];
}

interface HealthSectionProps {
  health: HealthData;
  onRefresh: () => void;
}

interface HealthArrayFieldProps {
  fieldId: string;
  label: string;
  options: string[];
  getLabel: (code: string) => string;
  items: HealthArrayItem[];
  onChange: (items: HealthArrayItem[]) => void;
  otherError: string | null;
  otherDescriptionPlaceholder: string;
  disabled: boolean;
}

function HealthArrayField({
  fieldId,
  label,
  options,
  getLabel,
  items,
  onChange,
  otherError,
  otherDescriptionPlaceholder,
  disabled,
}: HealthArrayFieldProps) {
  const selectedCodes = new Set(items.map((i) => i.code));
  const isOtherSelected = selectedCodes.has('OTHER');
  const otherItem = items.find((i) => i.code === 'OTHER');

  function toggle(code: string) {
    if (selectedCodes.has(code)) {
      onChange(items.filter((i) => i.code !== code));
    } else {
      onChange([...items, { code, description: '' }]);
    }
  }

  function setOtherDescription(description: string) {
    onChange(items.map((i) => (i.code === 'OTHER' ? { ...i, description } : i)));
  }

  return (
    <fieldset className="rounded-lg border border-border p-4 space-y-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((code) => {
          const isSelected = selectedCodes.has(code);
          return (
            <button
              key={code}
              type="button"
              disabled={disabled}
              onClick={() => toggle(code)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-50',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted',
              )}
              aria-pressed={isSelected}
              data-testid={`${fieldId}-pill-${code}`}
            >
              {getLabel(code)}
            </button>
          );
        })}
      </div>
      {isOtherSelected && (
        <div className="space-y-1">
          <Input
            aria-label={otherDescriptionPlaceholder}
            value={otherItem?.description ?? ''}
            onChange={(e) => setOtherDescription(e.target.value)}
            placeholder={otherDescriptionPlaceholder}
            maxLength={100}
            disabled={disabled}
            aria-invalid={otherError !== null}
            data-testid={`${fieldId}-description-OTHER`}
          />
          <FieldMessage error={otherError} />
        </div>
      )}
    </fieldset>
  );
}

function normalizeItems<T>(
  rawItems: {
    allergen?: T;
    phobia?: T;
    limitation?: T;
    condition?: T;
    description: string | null;
  }[],
): HealthArrayItem[] {
  return rawItems.map((item) => ({
    code: String(item.allergen ?? item.phobia ?? item.limitation ?? item.condition ?? ''),
    description: item.description ?? '',
  }));
}

function sortedItems(items: HealthArrayItem[]): HealthArrayItem[] {
  return [...items].sort((a, b) => a.code.localeCompare(b.code));
}

export function HealthSection({ health, onRefresh }: HealthSectionProps) {
  const { t } = useTranslation('profile');

  const [bloodType, setBloodType] = useState<BloodType | null>(health.bloodType);
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference | null>(
    health.dietaryPreference,
  );
  const [dietaryNotes, setDietaryNotes] = useState(health.dietaryNotes ?? '');
  const [generalMedicalNotes, setGeneralMedicalNotes] = useState(health.generalMedicalNotes ?? '');
  const [foodAllergies, setFoodAllergies] = useState<HealthArrayItem[]>(
    normalizeItems(health.foodAllergies),
  );
  const [phobias, setPhobias] = useState<HealthArrayItem[]>(normalizeItems(health.phobias));
  const [physicalLimitations, setPhysicalLimitations] = useState<HealthArrayItem[]>(
    normalizeItems(health.physicalLimitations),
  );
  const [medicalConditions, setMedicalConditions] = useState<HealthArrayItem[]>(
    normalizeItems(health.medicalConditions),
  );

  const [arrayErrors, setArrayErrors] = useState<Record<string, string | null>>({});
  const [isSaving, setIsSaving] = useState(false);

  const initialFoodAllergies = useMemo(
    () => normalizeItems(health.foodAllergies),
    [health.foodAllergies],
  );
  const initialPhobias = useMemo(() => normalizeItems(health.phobias), [health.phobias]);
  const initialPhysicalLimitations = useMemo(
    () => normalizeItems(health.physicalLimitations),
    [health.physicalLimitations],
  );
  const initialMedicalConditions = useMemo(
    () => normalizeItems(health.medicalConditions),
    [health.medicalConditions],
  );

  const isDirty = useMemo(
    () =>
      bloodType !== health.bloodType ||
      dietaryPreference !== health.dietaryPreference ||
      (dietaryNotes || null) !== health.dietaryNotes ||
      (generalMedicalNotes || null) !== health.generalMedicalNotes ||
      JSON.stringify(sortedItems(foodAllergies)) !==
        JSON.stringify(sortedItems(initialFoodAllergies)) ||
      JSON.stringify(sortedItems(phobias)) !== JSON.stringify(sortedItems(initialPhobias)) ||
      JSON.stringify(sortedItems(physicalLimitations)) !==
        JSON.stringify(sortedItems(initialPhysicalLimitations)) ||
      JSON.stringify(sortedItems(medicalConditions)) !==
        JSON.stringify(sortedItems(initialMedicalConditions)),
    [
      bloodType,
      dietaryPreference,
      dietaryNotes,
      generalMedicalNotes,
      foodAllergies,
      phobias,
      physicalLimitations,
      medicalConditions,
      health.bloodType,
      health.dietaryPreference,
      health.dietaryNotes,
      health.generalMedicalNotes,
      initialFoodAllergies,
      initialPhobias,
      initialPhysicalLimitations,
      initialMedicalConditions,
    ],
  );

  function validateArrays(): boolean {
    const errors: Record<string, string | null> = {};
    let hasError = false;

    const otherRequired = t('health.arrayField.otherDescriptionRequired');

    const namedArrays: [string, HealthArrayItem[]][] = [
      ['foodAllergies', foodAllergies],
      ['phobias', phobias],
      ['physicalLimitations', physicalLimitations],
      ['medicalConditions', medicalConditions],
    ];

    for (const [field, items] of namedArrays) {
      for (const item of items) {
        if (item.code === 'OTHER' && !item.description.trim()) {
          errors[`${field}-OTHER`] = otherRequired;
          hasError = true;
        }
      }
    }

    setArrayErrors(errors);
    return !hasError;
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();

    if (!validateArrays()) return;

    setIsSaving(true);
    try {
      await apiClient.patch('/v1/users/me/health', {
        bloodType,
        dietaryPreference,
        dietaryNotes:
          dietaryPreference === DietaryPreference.OTHER ? dietaryNotes.trim() || null : null,
        generalMedicalNotes: generalMedicalNotes.trim() || null,
        foodAllergies: foodAllergies.map((i) => ({
          allergen: i.code,
          description: i.description.trim() || null,
        })),
        phobias: phobias.map((i) => ({
          phobia: i.code,
          description: i.description.trim() || null,
        })),
        physicalLimitations: physicalLimitations.map((i) => ({
          limitation: i.code,
          description: i.description.trim() || null,
        })),
        medicalConditions: medicalConditions.map((i) => ({
          condition: i.code,
          description: i.description.trim() || null,
        })),
      });
      toast.success(t('health.saveSuccess'));
      setArrayErrors({});
      onRefresh();
    } catch {
      toast.error(t('health.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-8">
      <h2 className="text-xl font-semibold">{t('health.heading')}</h2>

      <p className="text-sm text-muted-foreground">{t('health.privacyNote')}</p>

      <fieldset className="rounded-lg border border-border p-4 space-y-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('health.bloodType.label')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {Object.values(BloodType).map((value) => {
            const isActive = value === bloodType;
            return (
              <button
                key={value}
                type="button"
                disabled={isSaving}
                onClick={() => setBloodType(isActive ? null : value)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:pointer-events-none disabled:opacity-50',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted',
                )}
                aria-pressed={isActive}
                data-testid={`bloodType-pill-${value}`}
              >
                {t(`health.bloodType.${value}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-border p-4 space-y-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('health.dietaryPreference.label')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {Object.values(DietaryPreference).map((value) => {
            const isActive = value === dietaryPreference;
            return (
              <button
                key={value}
                type="button"
                disabled={isSaving}
                onClick={() => setDietaryPreference(isActive ? null : value)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:pointer-events-none disabled:opacity-50',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted',
                )}
                aria-pressed={isActive}
              >
                {t(`health.dietaryPreference.${value}`)}
              </button>
            );
          })}
        </div>
        {dietaryPreference === DietaryPreference.OTHER && (
          <div className="space-y-1.5">
            <Label htmlFor="dietaryNotes">{t('health.dietaryNotes.label')}</Label>
            <Textarea
              id="dietaryNotes"
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              placeholder={t('health.dietaryNotes.placeholder')}
              maxLength={300}
              disabled={isSaving}
            />
          </div>
        )}
      </fieldset>

      <HealthArrayField
        fieldId="foodAllergies"
        label={t('health.foodAllergies.label')}
        options={Object.values(FoodAllergen)}
        getLabel={(code) => t(`health.foodAllergies.${code}`)}
        items={foodAllergies}
        onChange={setFoodAllergies}
        otherError={arrayErrors['foodAllergies-OTHER'] ?? null}
        otherDescriptionPlaceholder={t('health.arrayField.otherDescriptionPlaceholder')}
        disabled={isSaving}
      />

      <HealthArrayField
        fieldId="phobias"
        label={t('health.phobias.label')}
        options={Object.values(PhobiaType)}
        getLabel={(code) => t(`health.phobias.${code}`)}
        items={phobias}
        onChange={setPhobias}
        otherError={arrayErrors['phobias-OTHER'] ?? null}
        otherDescriptionPlaceholder={t('health.arrayField.otherDescriptionPlaceholder')}
        disabled={isSaving}
      />

      <HealthArrayField
        fieldId="physicalLimitations"
        label={t('health.physicalLimitations.label')}
        options={Object.values(PhysicalLimitationType)}
        getLabel={(code) => t(`health.physicalLimitations.${code}`)}
        items={physicalLimitations}
        onChange={setPhysicalLimitations}
        otherError={arrayErrors['physicalLimitations-OTHER'] ?? null}
        otherDescriptionPlaceholder={t('health.arrayField.otherDescriptionPlaceholder')}
        disabled={isSaving}
      />

      <HealthArrayField
        fieldId="medicalConditions"
        label={t('health.medicalConditions.label')}
        options={Object.values(MedicalConditionType)}
        getLabel={(code) => t(`health.medicalConditions.${code}`)}
        items={medicalConditions}
        onChange={setMedicalConditions}
        otherError={arrayErrors['medicalConditions-OTHER'] ?? null}
        otherDescriptionPlaceholder={t('health.arrayField.otherDescriptionPlaceholder')}
        disabled={isSaving}
      />

      <fieldset className="rounded-lg border border-border p-4 space-y-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('health.generalMedicalNotes.label')}
        </legend>
        <Textarea
          aria-label={t('health.generalMedicalNotes.label')}
          value={generalMedicalNotes}
          onChange={(e) => setGeneralMedicalNotes(e.target.value)}
          placeholder={t('health.generalMedicalNotes.placeholder')}
          maxLength={1000}
          disabled={isSaving}
        />
        <FieldMessage hint={t('health.generalMedicalNotes.hint')} />
      </fieldset>

      <SaveButton isSaving={isSaving} isDirty={isDirty} label={t('health.save')} />
    </form>
  );
}

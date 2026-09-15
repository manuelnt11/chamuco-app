'use client';

import { useState, useMemo, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { SaveButton } from '@/components/ui/save-button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { FieldMessage } from '@/components/ui/field-message';
import type { HealthArrayItem, HealthData } from '@/services/users.types';
import { updateMyHealth } from '@/services/users.service';
import {
  BloodType,
  DietaryPreference,
  FoodAllergen,
  PhobiaType,
  PhysicalLimitationType,
  MedicalConditionType,
} from '@chamuco/shared-types';

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
  const { t } = useTranslation('profile');
  const selectedCodes = items.map((i) => i.code);
  const isOtherSelected = selectedCodes.includes('OTHER');
  const otherItem = items.find((i) => i.code === 'OTHER');
  const multiSelectOptions = options.map((code) => ({ value: code, label: getLabel(code) }));

  function handleSelectedChange(codes: string[]) {
    onChange(codes.map((code) => items.find((i) => i.code === code) ?? { code, description: '' }));
  }

  function setOtherDescription(description: string) {
    onChange(items.map((i) => (i.code === 'OTHER' ? { ...i, description } : i)));
  }

  const labelId = `${fieldId}-label`;

  return (
    <div className="space-y-1.5">
      <Label id={labelId}>{label}</Label>
      <MultiSelect
        options={multiSelectOptions}
        selected={selectedCodes}
        onChange={handleSelectedChange}
        placeholder={t('health.arrayField.placeholder')}
        searchPlaceholder={t('health.arrayField.searchPlaceholder')}
        noResultsText={t('health.arrayField.noResults')}
        getRemoveAriaLabel={(itemLabel) => t('health.arrayField.removeItem', { label: itemLabel })}
        disabled={disabled}
        data-testid={fieldId}
        aria-labelledby={labelId}
      />
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
    </div>
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

  async function handleSave(e: SubmitEvent) {
    e.preventDefault();

    if (!validateArrays()) return;

    setIsSaving(true);
    try {
      await updateMyHealth({
        bloodType,
        dietaryPreference,
        dietaryNotes:
          dietaryPreference === DietaryPreference.OTHER ? dietaryNotes.trim() || null : null,
        generalMedicalNotes: generalMedicalNotes.trim() || null,
        foodAllergies: foodAllergies.map((i) => ({
          allergen: i.code as FoodAllergen,
          description: i.description.trim() || null,
        })),
        phobias: phobias.map((i) => ({
          phobia: i.code as PhobiaType,
          description: i.description.trim() || null,
        })),
        physicalLimitations: physicalLimitations.map((i) => ({
          limitation: i.code as PhysicalLimitationType,
          description: i.description.trim() || null,
        })),
        medicalConditions: medicalConditions.map((i) => ({
          condition: i.code as MedicalConditionType,
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

      <div className="grid grid-cols-[2fr_3fr] gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bloodType">{t('health.bloodType.label')}</Label>
          <Select
            id="bloodType"
            value={bloodType ?? ''}
            onChange={(e) => setBloodType((e.target.value || null) as BloodType | null)}
            disabled={isSaving}
            data-testid="bloodType-select"
          >
            <option value="">{t('health.bloodType.placeholder')}</option>
            {Object.values(BloodType).map((value) => (
              <option key={value} value={value}>
                {t(`health.bloodType.${value}`)}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dietaryPreference">{t('health.dietaryPreference.label')}</Label>
          <Select
            id="dietaryPreference"
            value={dietaryPreference ?? ''}
            onChange={(e) =>
              setDietaryPreference((e.target.value || null) as DietaryPreference | null)
            }
            disabled={isSaving}
            data-testid="dietaryPreference-select"
          >
            <option value="">{t('health.dietaryPreference.placeholder')}</option>
            {Object.values(DietaryPreference).map((value) => (
              <option key={value} value={value}>
                {t(`health.dietaryPreference.${value}`)}
              </option>
            ))}
          </Select>
        </div>
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

      <div className="space-y-1.5">
        <Label htmlFor="generalMedicalNotes">{t('health.generalMedicalNotes.label')}</Label>
        <Textarea
          id="generalMedicalNotes"
          value={generalMedicalNotes}
          onChange={(e) => setGeneralMedicalNotes(e.target.value)}
          placeholder={t('health.generalMedicalNotes.placeholder')}
          maxLength={1000}
          disabled={isSaving}
        />
        <FieldMessage hint={t('health.generalMedicalNotes.hint')} />
      </div>

      <SaveButton isSaving={isSaving} isDirty={isDirty} label={t('health.save')} />
    </form>
  );
}

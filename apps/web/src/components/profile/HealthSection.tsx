'use client';

import { useMemo, useState, type SubmitEvent } from 'react';
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

type ArrayFieldId = 'foodAllergies' | 'phobias' | 'physicalLimitations' | 'medicalConditions';

interface ArrayFieldConfig {
  fieldId: ArrayFieldId;
  payloadKey: 'allergen' | 'phobia' | 'limitation' | 'condition';
  enumValues: string[];
}

const ARRAY_FIELD_CONFIGS: ArrayFieldConfig[] = [
  { fieldId: 'foodAllergies', payloadKey: 'allergen', enumValues: Object.values(FoodAllergen) },
  { fieldId: 'phobias', payloadKey: 'phobia', enumValues: Object.values(PhobiaType) },
  {
    fieldId: 'physicalLimitations',
    payloadKey: 'limitation',
    enumValues: Object.values(PhysicalLimitationType),
  },
  {
    fieldId: 'medicalConditions',
    payloadKey: 'condition',
    enumValues: Object.values(MedicalConditionType),
  },
];

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
  const multiSelectOptions = useMemo(
    () => options.map((code) => ({ value: code, label: getLabel(code) })),
    [options, getLabel],
  );

  function handleSelectedChange(codes: string[]) {
    onChange(codes.map((code) => items.find((i) => i.code === code) ?? { code, description: '' }));
  }

  function setOtherDescription(description: string) {
    onChange(items.map((i) => (i.code === 'OTHER' ? { ...i, description } : i)));
  }

  const labelId = `${fieldId}-label`;

  return (
    <fieldset className="mx-0 space-y-1.5 border-0 p-0">
      <legend className="sr-only">{label}</legend>
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

function buildArrayFieldsState(health: HealthData): Record<ArrayFieldId, HealthArrayItem[]> {
  return {
    foodAllergies: normalizeItems(health.foodAllergies),
    phobias: normalizeItems(health.phobias),
    physicalLimitations: normalizeItems(health.physicalLimitations),
    medicalConditions: normalizeItems(health.medicalConditions),
  };
}

export function HealthSection({ health, onRefresh }: HealthSectionProps) {
  const { t } = useTranslation('profile');

  const [bloodType, setBloodType] = useState<BloodType | null>(health.bloodType);
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference | null>(
    health.dietaryPreference,
  );
  const [dietaryNotes, setDietaryNotes] = useState(health.dietaryNotes ?? '');
  const [generalMedicalNotes, setGeneralMedicalNotes] = useState(health.generalMedicalNotes ?? '');
  const [arrayFields, setArrayFields] = useState<Record<ArrayFieldId, HealthArrayItem[]>>(() =>
    buildArrayFieldsState(health),
  );

  const [arrayErrors, setArrayErrors] = useState<Record<string, string | null>>({});
  const [isSaving, setIsSaving] = useState(false);

  const initialArrayFields = useMemo<Record<ArrayFieldId, HealthArrayItem[]>>(
    () => ({
      foodAllergies: normalizeItems(health.foodAllergies),
      phobias: normalizeItems(health.phobias),
      physicalLimitations: normalizeItems(health.physicalLimitations),
      medicalConditions: normalizeItems(health.medicalConditions),
    }),
    [health.foodAllergies, health.phobias, health.physicalLimitations, health.medicalConditions],
  );

  const isDirty = useMemo(
    () =>
      bloodType !== health.bloodType ||
      dietaryPreference !== health.dietaryPreference ||
      (dietaryNotes || null) !== health.dietaryNotes ||
      (generalMedicalNotes || null) !== health.generalMedicalNotes ||
      ARRAY_FIELD_CONFIGS.some(
        ({ fieldId }) =>
          JSON.stringify(sortedItems(arrayFields[fieldId])) !==
          JSON.stringify(sortedItems(initialArrayFields[fieldId])),
      ),
    [
      bloodType,
      dietaryPreference,
      dietaryNotes,
      generalMedicalNotes,
      arrayFields,
      health.bloodType,
      health.dietaryPreference,
      health.dietaryNotes,
      health.generalMedicalNotes,
      initialArrayFields,
    ],
  );

  function validateArrays(): boolean {
    const errors: Record<string, string | null> = {};
    let hasError = false;

    const otherRequired = t('health.arrayField.otherDescriptionRequired');

    for (const { fieldId } of ARRAY_FIELD_CONFIGS) {
      for (const item of arrayFields[fieldId]) {
        if (item.code === 'OTHER' && !item.description.trim()) {
          errors[`${fieldId}-OTHER`] = otherRequired;
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
      const arrayPayload = Object.fromEntries(
        ARRAY_FIELD_CONFIGS.map(({ fieldId, payloadKey }) => [
          fieldId,
          arrayFields[fieldId].map((i) => ({
            [payloadKey]: i.code,
            description: i.description.trim() || null,
          })),
        ]),
      ) as Pick<HealthData, ArrayFieldId>;

      await updateMyHealth({
        bloodType,
        dietaryPreference,
        dietaryNotes:
          dietaryPreference === DietaryPreference.OTHER ? dietaryNotes.trim() || null : null,
        generalMedicalNotes: generalMedicalNotes.trim() || null,
        ...arrayPayload,
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_3fr]">
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

      {ARRAY_FIELD_CONFIGS.map(({ fieldId, enumValues }) => (
        <HealthArrayField
          key={fieldId}
          fieldId={fieldId}
          label={t(`health.${fieldId}.label`)}
          options={enumValues}
          getLabel={(code) => t(`health.${fieldId}.${code}`)}
          items={arrayFields[fieldId]}
          onChange={(items) => setArrayFields((prev) => ({ ...prev, [fieldId]: items }))}
          otherError={arrayErrors[`${fieldId}-OTHER`] ?? null}
          otherDescriptionPlaceholder={t('health.arrayField.otherDescriptionPlaceholder')}
          disabled={isSaving}
        />
      ))}

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

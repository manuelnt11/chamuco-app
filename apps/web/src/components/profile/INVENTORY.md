# Inventory: profile

---

## `AvatarEditor.tsx`

### Imports

- `react` — useState, useRef, ChangeEvent
- `react-i18next` — useTranslation
- `@chamuco/shared-utils` — getTwemojiUrl
- `@chamuco/shared-types` — UploadType
- `@/components/ui/avatar` — Avatar
- `@/components/ui/dialog` — Dialog, DialogTrigger, DialogPopup, DialogHeader, DialogTitle, DialogClose
- `@/components/ui/toast` — toast
- `@/services/users.service` — updateMyAvatar
- `@/hooks/useFileUpload` — useFileUpload
- `@/hooks/useUser` — useUser
- `@/store/user` — AppUser (type)
- `@/lib/name-utils` — getInitials
- `@/lib/avatar-emojis` — AVATAR_EMOJIS
- `@/components/ui/crop-modal` — CropModal

### Definitions

- `Tab` (type) — union of `'photo' | 'emoji'` for dialog tab state
- `AvatarEditorProps` (interface) — props for AvatarEditor
- `AvatarEditor` (component) — dialog with photo-upload (crop) and emoji-picker tabs for updating user avatar

### Exports

- `AvatarEditor` — named

---

## `AvatarEditor.test.tsx`

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `@chamuco/shared-types` — ProfileVisibility
- `@/store/user` — AppUser (type)
- `./AvatarEditor` — AvatarEditor

### Definitions

- `baseUser` (const) — fixture AppUser used across tests
- `setup` (function) — renders AvatarEditor with optional user overrides and returns userEvent instance

### Exports

_(none)_

---

## `BasicInfoSection.tsx`

### Imports

- `react` — useState, SubmitEvent (type)
- `react-i18next` — useTranslation
- `@chamuco/shared-types` — ProfileVisibility
- `@/components/ui/input` — Input
- `@/components/ui/label` — Label
- `@/components/ui/save-button` — SaveButton
- `@/components/ui/select` — Select
- `@/components/ui/textarea` — Textarea
- `@/components/ui/timezone-combobox` — TimezoneCombobox
- `@/components/ui/toast` — toast
- `@/components/ui/field-message` — FieldMessage
- `@/services/users.types` — BasicInfoProfile (type)
- `@/services/users.service` — updateMe, updateMyProfile
- `@/hooks/useUser` — useUser
- `@/store/user` — AppUser (type)
- `@/lib/timezones` — COUNTRY_TIMEZONE
- `./AvatarEditor` — AvatarEditor

### Definitions

- `BasicInfoSectionProps` (interface) — props for BasicInfoSection
- `BasicInfoSection` (component) — form for display name, bio, timezone, profile visibility, and avatar editing

### Exports

- `BasicInfoSection` — named

---

## `BasicInfoSection.test.tsx`

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `@chamuco/shared-types` — ProfileVisibility
- `@/store/user` — AppUser (type)
- `./BasicInfoSection` — BasicInfoSection
- `@/services/users.types` — BasicInfoProfile (type)

### Definitions

- `baseUser` (const) — fixture AppUser used across tests
- `baseProfile` (const) — fixture BasicInfoProfile used across tests
- `setup` (function) — renders BasicInfoSection with optional overrides and returns userEvent and onRefresh mock

### Exports

_(none)_

---

## `EmergencyContactsSection.tsx`

### Imports

- `react` — useEffect, useState, SubmitEvent (type)
- `react-i18next` — useTranslation
- `@/lib/countries` — isoByCallingCode
- `@phosphor-icons/react` — PlusIcon
- `@/lib/utils` — cn
- `@/components/ui/button` — Button
- `@/components/ui/combobox-popover` — ComboboxPopover
- `@/components/ui/command` — CommandOption
- `@/components/ui/edit-delete-actions` — EditDeleteActions
- `@/components/ui/input` — Input
- `@/components/ui/label` — Label
- `@/components/ui/select-item` — SelectItem
- `@/components/ui/country-combobox` — getCallingCode
- `@/components/ui/phone-input` — PhoneInput, cleanPhoneNumber, isPhoneValid
- `@/components/ui/save-button` — SaveButton
- `@/components/ui/toast` — toast
- `@/components/ui/field-message` — FieldMessage
- `@/services/users.types` — EmergencyContactDto (type)
- `@/services/users.service` — createEmergencyContact, updateEmergencyContact, deleteEmergencyContact
- `@/lib/name-utils` — NAME_REGEX, normalizeName

### Definitions

- `RELATIONSHIP_KEYS` (const) — predefined relationship key list for `RelationshipCombobox` suggestions
- `RelationshipComboboxProps` (interface) — props for `RelationshipCombobox`
- `RelationshipCombobox` (component) — free-text popover combobox (replaces the former `<input list>`/`<datalist>` pair) built on `ComboboxPopover`, uppercasing input and offering `RELATIONSHIP_KEYS` as filterable suggestions; typed text that matches nothing is still accepted as free text via `onChange`
- `FormState` (interface) — local form state shape for a single contact
- `FormErrors` (interface) — field-level error state for a single contact form
- `EMPTY_ERRORS` (const) — zeroed-out FormErrors sentinel
- `makeEmptyForm` (function) — factory returning a blank FormState with optional isPrimary default
- `getIsoFromCallingCode` (function) — converts calling code string to ISO-2 country code
- `ContactFormProps` (interface) — props for ContactForm
- `ContactForm` (component) — reusable inline form for create/edit of a single emergency contact
- `EmergencyContactsSectionProps` (interface) — props for EmergencyContactsSection
- `EmergencyContactsSection` (component) — list + inline add/edit/delete UI for user emergency contacts

### Exports

- `EmergencyContactsSection` — named

---

## `EmergencyContactsSection.test.tsx`

### Imports

- `@testing-library/react` — render, screen, waitFor, fireEvent, within
- `@testing-library/user-event` — userEvent
- `@/services/users.types` — EmergencyContactDto (type)
- `./EmergencyContactsSection` — EmergencyContactsSection

### Definitions

- `sampleContacts` (const) — fixture array of EmergencyContactDto used across tests
- `setup` (function) — renders EmergencyContactsSection with optional contacts and returns userEvent and onRefresh mock
- `setRelationship` (function) — test helper; opens the real (unmocked) `RelationshipCombobox` popover by clicking its trigger, then `fireEvent.change`s its search input to set the value in one step
- Stubs `ResizeObserver`/`scrollIntoView` per test (real `ComboboxPopover`/`cmdk` render for `RelationshipCombobox`, unlike `CountryCombobox` which stays fully mocked in this file)

### Exports

_(none)_

---

## `EtasSubsection.tsx`

### Imports

- `react` — useEffect, useState, SubmitEvent (type)
- `react-i18next` — useTranslation
- `@/lib/countries` — getEmojiFlag
- `@chamuco/shared-types` — DocumentStatus, EtaType, VisaEntries
- `@chamuco/shared-utils` — DOCUMENT_ID_FORMAT_REGEX
- `@/components/ui/button` — Button
- `@/components/ui/edit-delete-actions` — EditDeleteActions
- `@/components/ui/input` — Input
- `@/components/ui/label` — Label
- `@/components/ui/select` — Select
- `@/components/ui/textarea` — Textarea
- `@/components/ui/country-combobox` — CountryCombobox
- `@/components/ui/save-button` — SaveButton
- `@/components/ui/spinner` — Spinner
- `@/components/ui/field-message` — FieldMessage
- `@/components/ui/toast` — toast
- `@/services/users.types` — EtaDto (type)
- `@/services/users.service` — getMyEtas, createEta, updateEta, deleteEta
- `@/lib/utils` — cn

### Definitions

- `FormState` (interface) — local ETA form state shape
- `FormErrors` (interface) — ETA field-level error state
- `EMPTY_ERRORS` (const) — zeroed-out FormErrors sentinel
- `makeEmptyForm` (function) — factory returning blank ETA FormState
- `documentStatusBadgeClass` (function) — maps DocumentStatus to Tailwind badge class string
- `EtaFormProps` (interface) — props for EtaForm
- `EtaForm` (component) — inline form for create/edit of a single ETA record; destination is read-only in edit mode
- `EtasSubsectionProps` (interface) — props for EtasSubsection
- `EtasSubsection` (component) — lazy-loaded list + inline CRUD for ETAs belonging to a nationality

### Exports

- `EtasSubsection` — named

---

## `EtasSubsection.test.tsx`

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `@chamuco/shared-types` — DocumentStatus, EtaType, VisaEntries

### Definitions

_(no substantial non-test definitions)_

### Exports

_(none)_

---

## `HealthSection.tsx`

### Imports

- `react` — useState, useMemo, SubmitEvent (type)
- `react-i18next` — useTranslation
- `@/components/ui/input` — Input
- `@/components/ui/label` — Label
- `@/components/ui/multi-select` — MultiSelect
- `@/components/ui/save-button` — SaveButton
- `@/components/ui/select` — Select
- `@/components/ui/textarea` — Textarea
- `@/components/ui/toast` — toast
- `@/components/ui/field-message` — FieldMessage
- `@/services/users.types` — HealthArrayItem, HealthData (types)
- `@/services/users.service` — updateMyHealth
- `@chamuco/shared-types` — BloodType, DietaryPreference, FoodAllergen, PhobiaType, PhysicalLimitationType, MedicalConditionType

### Definitions

- `ArrayFieldId` (type) — `'foodAllergies' | 'phobias' | 'physicalLimitations' | 'medicalConditions'`
- `ArrayFieldConfig` (interface) — `{ fieldId, enumValues }` shape driving the 4 array fields' rendering/dirty-check/validation (no payload key — the `updateMyHealth` payload is built with an explicit per-field mapping in `handleSave` instead, so a config typo can't silently mis-map a field's DTO key past the type checker)
- `ARRAY_FIELD_CONFIGS` (const) — config array for the 4 array fields; drives the JSX list, `isDirty`, and `validateArrays` via `.map()`/`.some()` instead of 4 hand-written copies
- `HealthSectionProps` (interface) — props for HealthSection
- `HealthArrayFieldProps` (interface) — props for HealthArrayField
- `HealthArrayField` (component) — borderless `<fieldset>` with a screen-reader-only `<legend>` (keeps the OTHER-description `Input` semantically grouped with its `MultiSelect` without a visible border) wrapping a `MultiSelect` for one health array category, with optional OTHER description input; passes `selectedHint={t('common:a11y.selected')}` to `MultiSelect`
- `normalizeItems` (function) — converts raw health DTO array items to HealthArrayItem format
- `sortedItems` (function) — returns a sorted copy of HealthArrayItem array for stable dirty comparison
- `buildArrayFieldsState` (function) — builds a `Record<ArrayFieldId, HealthArrayItem[]>` from the 4 raw health array fields (passed individually, not as the whole `HealthData` object, so the `useMemo` call site's dependency array can name each field directly); shared by the initial `useState` and the `initialArrayFields` dirty-check memo
- `HealthSection` (component) — form for blood type, dietary preference (popover-based `Select`s, options built via `Object.values(Enum).map(...)`, in a `grid-cols-1 sm:grid-cols-[2fr_3fr]` row), and the 4 config-driven array fields

### Exports

- `HealthSection` — named

---

## `HealthSection.test.tsx`

### Imports

- `react` — ComponentProps, ReactNode (types)
- `@testing-library/react` — render, screen, waitFor, within
- `@testing-library/user-event` — userEvent
- `./HealthSection` — HealthSection under test
- `@/services/users.types` — HealthData (type)
- `@chamuco/shared-types` — BloodType, DietaryPreference, FoodAllergen
- `@/components/ui/toast` — toast

### Definitions

- `selectArrayOption` (function) — test helper; opens a `MultiSelect` field's dropdown by `data-testid` and clicks the given option's `data-testid`
- `selectSingleOption` (function) — same pattern for a single-select `Select` field: click the trigger by `data-testid`, then click `${fieldId}-option-${value}`
- `clearSingleSelect` (function) — click a `Select` trigger then its `${fieldId}-placeholder` row, to exercise the "deselect back to nothing" case
- Mocks `@/components/ui/input`, `textarea`, `spinner`, `button`, `label` as thin passthrough elements (no `select` mock — `Select` now goes through the same `popover`/`command` mocks as `MultiSelect`)
- Mocks `@/components/ui/popover` (`Popover`, `PopoverTrigger`, `PopoverContent`) and `@/components/ui/command` (`Command`, `CommandSearch`, `CommandItems`, `CommandNoResults`, `CommandGroupSection`, `CommandOption`) so both `Select` and `MultiSelect`'s underlying `ComboboxPopover` render without real Base UI/`cmdk` portal behavior in tests; `PopoverTrigger`'s mock reflects the real `disabled` prop as `aria-disabled` on a `role="button"` div

### Exports

_(none)_

---

## `LoyaltyProgramsSection.tsx`

### Imports

- `react` — useState, SubmitEvent (type)
- `react-i18next` — useTranslation
- `@phosphor-icons/react` — PlusIcon
- `@/components/ui/button` — Button
- `@/components/ui/edit-delete-actions` — EditDeleteActions
- `@/components/ui/input` — Input
- `@/components/ui/label` — Label
- `@/components/ui/loyalty-program-combobox` — LoyaltyProgramCombobox
- `@/components/ui/save-button` — SaveButton
- `@/components/ui/textarea` — Textarea
- `@/components/ui/toast` — toast
- `@/services/users.types` — LoyaltyProgramDto (type)
- `@/services/users.service` — createLoyaltyProgram, updateLoyaltyProgram, deleteLoyaltyProgram

### Definitions

- `FormState` (interface) — local form state shape for a loyalty program entry
- `EMPTY_FORM` (const) — empty FormState sentinel
- `LoyaltyProgramsSectionProps` (interface) — props for LoyaltyProgramsSection
- `ProgramFormProps` (interface) — props for ProgramForm
- `ProgramForm` (component) — inline form for create/edit of a single loyalty program record; `LoyaltyProgramCombobox` no longer takes `required`/`maxLength` (no literal `<input>` backs it), so `handleAdd`/`handleUpdate` explicitly reject an empty `programName` with a toast error before submitting
- `LoyaltyProgramsSection` (component) — list + inline add/edit/delete UI for travel loyalty programs; duplicate detection and empty-`programName` validation before POST/PATCH

### Exports

- `LoyaltyProgramsSection` — named

---

## `LoyaltyProgramsSection.test.tsx`

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent

### Definitions

- Mocks `@/components/ui/loyalty-program-combobox` as a plain `<input>` (no longer forwards `required`/`maxLength` — the component doesn't accept them anymore); covers the `programNameRequired` toast-error validation added to `handleAdd`/`handleUpdate`

### Exports

_(none)_

---

## `NationalitiesSection.tsx`

### Imports

- `react` — useState, SubmitEvent (type)
- `axios` — axios (for isAxiosError)
- `react-i18next` — useTranslation
- `@/lib/countries` — getCountryName, getEmojiFlag
- `@phosphor-icons/react` — CaretDownIcon, GlobeIcon, IdentificationCardIcon, PlusIcon
- `@chamuco/shared-types` — PassportStatus
- `@chamuco/shared-utils` — DOCUMENT_ID_FORMAT_REGEX
- `@/components/ui/button` — Button
- `@/components/ui/edit-delete-actions` — EditDeleteActions
- `@/components/ui/input` — Input
- `@/components/ui/label` — Label
- `@/components/ui/country-combobox` — CountryCombobox
- `@/components/ui/save-button` — SaveButton
- `@/components/ui/toast` — toast
- `@/components/ui/field-message` — FieldMessage
- `@/services/users.types` — NationalityDto (type)
- `@/services/users.service` — createNationality, updateNationality, deleteNationality
- `@/lib/utils` — cn
- `./VisasSubsection` — VisasSubsection
- `./EtasSubsection` — EtasSubsection

### Definitions

- `FormState` (interface) — local nationality form state shape including passport fields
- `FormErrors` (interface) — nationality field-level error state
- `EMPTY_ERRORS` (const) — zeroed-out FormErrors sentinel
- `makeEmptyForm` (function) — factory returning blank nationality FormState with optional isPrimary default
- `passportStatusBadgeClass` (function) — maps PassportStatus to Tailwind badge class string
- `NationalityFormProps` (interface) — props for NationalityForm
- `NationalityForm` (component) — inline form for create/edit of a nationality record with optional national ID and passport fields
- `NationalitiesSectionProps` (interface) — props for NationalitiesSection
- `NationalitiesSection` (component) — list + inline CRUD for nationalities; expands per-row to show VisasSubsection and EtasSubsection

### Exports

- `NationalitiesSection` — named

---

## `NationalitiesSection.test.tsx`

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `@chamuco/shared-types` — PassportStatus

### Definitions

_(no substantial non-test definitions)_

### Exports

_(none)_

---

## `NotificationPreferencesSection.tsx`

### Imports

- `react` — useState
- `react-i18next` — useTranslation
- `@chamuco/shared-types` — DisabledNotificationChannels (type), NotificationChannel, NotificationType
- `@/components/ui/checkbox` — Checkbox
- `@/components/ui/toast` — toast
- `@/services/users.types` — NotificationPreferencesData (type)
- `@/services/users.service` — updateMyNotificationPreferences

### Definitions

- `NotificationPreferencesSectionProps` (interface) — props for NotificationPreferencesSection
- `CONFIGURABLE_CHANNELS` (const) — const tuple of user-configurable channels (PUSH, EMAIL)
- `ConfigurableChannel` (type) — derived union type from CONFIGURABLE_CHANNELS
- `EMAIL_SUPPORTED` (const) — set of NotificationTypes that support the EMAIL channel
- `supportsChannel` (function) — returns whether a notification type supports a given configurable channel
- `NotificationPreferencesSection` (component) — matrix table of notification types vs channels with per-cell checkbox toggles; auto-saves on each toggle

### Exports

- `NotificationPreferencesSection` — named

---

## `PersonalDetailsSection.tsx`

### Imports

- `react` — useState, SubmitEvent (type)
- `react-i18next` — useTranslation
- `@/lib/countries` — isoByCallingCode
- `@/components/ui/date-of-birth-field` — DateOfBirthField
- `@/components/ui/input` — Input
- `@/components/ui/label` — Label
- `@/components/ui/save-button` — SaveButton
- `@/components/ui/country-combobox` — CountryCombobox, getCallingCode
- `@/components/ui/city-combobox` — CityCombobox
- `@/components/ui/phone-input` — PhoneInput, cleanPhoneNumber, isPhoneValid
- `@/components/ui/toast` — toast
- `@/components/ui/field-message` — FieldMessage
- `@/services/users.types` — PersonalDetailsProfile (type)
- `@/services/users.service` — updateMyProfile
- `@chamuco/shared-utils` — isValidCalendarDay
- `@/lib/name-utils` — NAME_REGEX, normalizeName

### Definitions

- `PersonalDetailsSectionProps` (interface) — props for PersonalDetailsSection
- `callingCodeToIso2` (function) — converts a calling code string (e.g. `+57`) to ISO-2 country code
- `CURRENT_YEAR` (const) — current calendar year used as DOB validation upper bound
- `PersonalDetailsSection` (component) — form for first/last name (uppercase), date of birth, email, phone, birth location, and home location

### Exports

- `PersonalDetailsSection` — named

---

## `PersonalDetailsSection.test.tsx`

### Imports

- `react` — ComponentProps (type)
- `@testing-library/react` — render, screen, waitFor, fireEvent
- `@testing-library/user-event` — userEvent

### Definitions

_(no substantial non-test definitions)_

### Exports

_(none)_

---

## `PreferencesSection.tsx`

### Imports

- `react` — useState
- `react-i18next` — useTranslation
- `next-themes` — useTheme
- `@/components/ui/toast` — toast
- `@/services/users.types` — PreferencesData (type)
- `@/services/users.service` — updateMyPreferences
- `@/lib/i18n/client` — changeLanguage
- `@chamuco/shared-types` — AppLanguage, AppCurrency, AppTheme
- `@/lib/utils` — cn

### Definitions

- `PreferencesSectionProps` (interface) — props for PreferencesSection
- `OptionButtonProps` (interface) — generic props for the OptionButton pill component
- `OptionButton` (component) — generic togglable pill button used for preference value selection
- `PreferencesSection` (component) — pill-button selectors for app language, currency, and theme; auto-saves each preference individually

### Exports

- `PreferencesSection` — named

---

## `PreferencesSection.test.tsx`

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `./PreferencesSection` — PreferencesSection
- `@chamuco/shared-types` — AppLanguage, AppCurrency, AppTheme
- `@/services/users.types` — PreferencesData (type)

### Definitions

_(no substantial non-test definitions)_

### Exports

_(none)_

---

## `VisasSubsection.tsx`

### Imports

- `react` — useEffect, useState, SubmitEvent (type)
- `react-i18next` — useTranslation
- `@/lib/countries` — getEmojiFlag
- `@chamuco/shared-types` — DocumentStatus, VisaCoverageType, VisaEntries, VisaType, VisaZone
- `@/components/ui/button` — Button
- `@/components/ui/edit-delete-actions` — EditDeleteActions
- `@/components/ui/input` — Input
- `@/components/ui/label` — Label
- `@/components/ui/select` — Select
- `@/components/ui/textarea` — Textarea
- `@/components/ui/country-combobox` — CountryCombobox
- `@/components/ui/save-button` — SaveButton
- `@/components/ui/spinner` — Spinner
- `@/components/ui/field-message` — FieldMessage
- `@/components/ui/toast` — toast
- `@/services/users.types` — CreateVisaPayload, UpdateVisaPayload, VisaDto (types)
- `@/services/users.service` — getMyVisas, createVisa, updateVisa, deleteVisa
- `@/lib/utils` — cn

### Definitions

- `FormState` (interface) — local visa form state shape (supports country or zone coverage)
- `FormErrors` (interface) — visa field-level error state
- `EMPTY_ERRORS` (const) — zeroed-out FormErrors sentinel
- `makeEmptyForm` (function) — factory returning blank visa FormState
- `documentStatusBadgeClass` (function) — maps DocumentStatus to Tailwind badge class string
- `VisaFormProps` (interface) — props for VisaForm
- `VisaForm` (component) — inline form for create/edit of a visa; coverage type and destination are read-only in edit mode
- `VisasSubsectionProps` (interface) — props for VisasSubsection
- `VisasSubsection` (component) — lazy-loaded list + inline CRUD for visas belonging to a nationality

### Exports

- `VisasSubsection` — named

---

## `VisasSubsection.test.tsx`

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `@chamuco/shared-types` — DocumentStatus, VisaCoverageType, VisaEntries, VisaType, VisaZone

### Definitions

_(no substantial non-test definitions)_

### Exports

_(none)_

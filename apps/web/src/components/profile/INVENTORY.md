# Inventory: profile

---

## AvatarEditor.tsx

### Imports

- `react` — useState, useRef, ChangeEvent (type)
- `react-i18next` — useTranslation
- `@chamuco/shared-utils` — getTwemojiUrl (builds Twemoji CDN URL from emoji string)
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

- `Tab` (type) — Union `'photo' | 'emoji'` for dialog tab state
- `AvatarEditorProps` (interface) — Props: `user: AppUser`
- `AvatarEditor` (component) — Dialog with photo-upload-and-crop tab and emoji-picker tab; calls `updateMyAvatar` and refreshes user on success

### Exports

- `AvatarEditor` — named

---

## AvatarEditor.test.tsx

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `@chamuco/shared-types` — ProfileVisibility
- `@/store/user` — AppUser (type)
- `./AvatarEditor` — AvatarEditor

### Definitions

- `mocks` (const) — Hoisted vi mock factories: mockPatch, mockToastSuccess, mockToastError, mockRefresh, mockUpload
- `baseUser` (const) — Shared AppUser fixture used across test cases
- `setup` (function) — Renders AvatarEditor with optional user overrides, returns userEvent instance

### Exports

- none

---

## BasicInfoSection.tsx

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

- `BasicInfoSectionProps` (interface) — Props: `user`, `userProfile`, `onRefresh`
- `BasicInfoSection` (component) — Form for display name, bio, timezone (auto-suggested from homeCountry when UTC), and profile visibility; embeds AvatarEditor; patches `/v1/users/me` and `/v1/users/me/profile` in parallel

### Exports

- `BasicInfoSection` — named

---

## BasicInfoSection.test.tsx

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `@chamuco/shared-types` — ProfileVisibility
- `@/store/user` — AppUser (type)
- `./BasicInfoSection` — BasicInfoSection
- `@/services/users.types` — BasicInfoProfile (type)

### Definitions

- `mocks` (const) — Hoisted mock factories: mockPatch, mockToastSuccess, mockToastError, mockRefresh
- `baseUser` (const) — Shared AppUser fixture
- `baseProfile` (const) — Shared BasicInfoProfile fixture
- `setup` (function) — Renders BasicInfoSection with optional overrides, returns userEvent instance and onRefresh spy

### Exports

- none

---

## EmergencyContactsSection.tsx

### Imports

- `react` — useState, SubmitEvent (type)
- `react-i18next` — useTranslation
- `@/lib/countries` — isoByCallingCode
- `@phosphor-icons/react` — PlusIcon
- `@/components/ui/button` — Button
- `@/components/ui/edit-delete-actions` — EditDeleteActions
- `@/components/ui/input` — Input
- `@/components/ui/label` — Label
- `@/components/ui/country-combobox` — getCallingCode
- `@/components/ui/phone-input` — PhoneInput, cleanPhoneNumber, isPhoneValid
- `@/components/ui/save-button` — SaveButton
- `@/components/ui/toast` — toast
- `@/components/ui/field-message` — FieldMessage
- `@/services/users.types` — EmergencyContactDto (type)
- `@/services/users.service` — createEmergencyContact, updateEmergencyContact, deleteEmergencyContact
- `@/lib/name-utils` — NAME_REGEX, normalizeName

### Definitions

- `RELATIONSHIP_KEYS` (const) — Read-only tuple of relationship i18n keys used to populate the datalist
- `FormState` (interface) — Internal form fields: fullName, phoneCountryIso, phoneCountryCode, phoneLocalNumber, relationship, isPrimary
- `FormErrors` (interface) — Per-field validation error strings
- `EMPTY_ERRORS` (const) — Zero-error FormErrors constant
- `makeEmptyForm` (function) — Returns blank FormState with optional isPrimary default
- `getIsoFromCallingCode` (function) — Maps `+XX` calling code to ISO2, falls back to `'CO'`
- `ContactFormProps` (interface) — Props for the internal ContactForm sub-component
- `ContactForm` (component) — Internal reusable form (add or edit) with fullName, PhoneInput, relationship datalist, and isPrimary checkbox
- `EmergencyContactsSectionProps` (interface) — Props: `contacts`, `onRefresh`
- `EmergencyContactsSection` (component) — List + inline add/edit/delete of emergency contacts with name/phone/relationship validation

### Exports

- `EmergencyContactsSection` — named

---

## EmergencyContactsSection.test.tsx

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `@/services/users.types` — EmergencyContactDto (type)
- `./EmergencyContactsSection` — EmergencyContactsSection

### Definitions

- `mocks` (const) — Hoisted mock factories: mockPost, mockPatch, mockDelete, mockToastSuccess, mockToastError, mockRandomUUID, mockIsValidPhoneNumber
- `sampleContacts` (const) — Fixture array of two EmergencyContactDto entries
- `setup` (function) — Renders EmergencyContactsSection with optional contacts override, returns userEvent instance and onRefresh spy

### Exports

- none

---

## EtasSubsection.tsx

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

- `FormState` (interface) — Internal form fields: destinationCountry, authorizationNumber, etaType, entries, expiryDate, notes
- `FormErrors` (interface) — Per-field validation error strings
- `EMPTY_ERRORS` (const) — Zero-error FormErrors constant
- `makeEmptyForm` (function) — Returns blank FormState
- `documentStatusBadgeClass` (function) — Returns Tailwind class string for a DocumentStatus badge (ACTIVE/EXPIRING_SOON/EXPIRED)
- `EtaFormProps` (interface) — Props for the internal EtaForm sub-component
- `EtaForm` (component) — Internal form for add/edit of an ETA; destination country is read-only on edit; auto-uppercases authorization number
- `EtasSubsectionProps` (interface) — Props: `nationalityId`, `passportNumber`
- `EtasSubsection` (component) — Fetches ETAs on mount via `getMyEtas`; manages add/edit/delete inline; disables Add when no passportNumber; shows spinner while loading

### Exports

- `EtasSubsection` — named

---

## EtasSubsection.test.tsx

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `@chamuco/shared-types` — DocumentStatus, EtaType, VisaEntries
- `./EtasSubsection` — EtasSubsection
- `@/services/users.types` — EtaDto (type)

### Definitions

- `mocks` (const) — Hoisted mock factories: mockGet, mockPost, mockPatch, mockDelete, mockToastSuccess, mockToastError
- `sampleEtas` (const) — Fixture array of two EtaDto entries (ACTIVE + EXPIRED)
- `setup` (function) — Renders EtasSubsection with optional passportNumber, returns userEvent instance

### Exports

- none

---

## HealthSection.tsx

### Imports

- `react` — useState, useMemo, SubmitEvent (type)
- `react-i18next` — useTranslation
- `@/components/ui/input` — Input
- `@/components/ui/label` — Label
- `@/components/ui/save-button` — SaveButton
- `@/components/ui/textarea` — Textarea
- `@/components/ui/toast` — toast
- `@/components/ui/field-message` — FieldMessage
- `@/services/users.types` — HealthArrayItem, HealthData (types)
- `@/services/users.service` — updateMyHealth
- `@chamuco/shared-types` — BloodType, DietaryPreference, FoodAllergen, PhobiaType, PhysicalLimitationType, MedicalConditionType
- `@/lib/utils` — cn

### Definitions

- `HealthSectionProps` (interface) — Props: `health`, `onRefresh`
- `HealthArrayFieldProps` (interface) — Props for the internal HealthArrayField pill-picker
- `HealthArrayField` (component) — Generic pill-toggle field for health arrays; shows a free-text description input when `OTHER` is selected
- `normalizeItems` (function) — Converts typed health sub-item arrays (allergens, phobias, etc.) to `HealthArrayItem[]`
- `sortedItems` (function) — Returns a sorted copy of `HealthArrayItem[]` by code, used for dirty comparison
- `HealthSection` (component) — Form with pill pickers for blood type, dietary preference, food allergies, phobias, physical limitations, and medical conditions; validates that OTHER entries have a description before saving

### Exports

- `HealthSection` — named

---

## HealthSection.test.tsx

### Imports

- `react` — ComponentProps (type)
- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `./HealthSection` — HealthSection
- `@/services/users.types` — HealthData (type)
- `@chamuco/shared-types` — BloodType, DietaryPreference

### Definitions

- `mocks` (const) — Hoisted mock factories: mockPatch, mockToastSuccess, mockToastError
- `baseHealth` (const) — Fixture HealthData with all fields null or empty arrays
- `setup` (function) — Renders HealthSection with optional health overrides, returns userEvent instance and onRefresh spy

### Exports

- none

---

## LoyaltyProgramsSection.tsx

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

- `FormState` (interface) — Internal form fields: programName, memberId, notes
- `EMPTY_FORM` (const) — Zero-value FormState constant
- `LoyaltyProgramsSectionProps` (interface) — Props: `programs`, `onRefresh`
- `ProgramFormProps` (interface) — Props for the internal ProgramForm sub-component
- `ProgramForm` (component) — Internal add/edit form with LoyaltyProgramCombobox, memberId input, and optional notes textarea
- `LoyaltyProgramsSection` (component) — List + inline add/edit/delete of loyalty programs; blocks duplicates (same programName + memberId, case-insensitive) on add

### Exports

- `LoyaltyProgramsSection` — named

---

## LoyaltyProgramsSection.test.tsx

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `@/services/users.types` — LoyaltyProgramDto (type)
- `./LoyaltyProgramsSection` — LoyaltyProgramsSection

### Definitions

- `mocks` (const) — Hoisted mock factories: mockPost, mockPatch, mockDelete, mockToastSuccess, mockToastError, mockRandomUUID
- `samplePrograms` (const) — Fixture array of two LoyaltyProgramDto entries
- `setup` (function) — Renders LoyaltyProgramsSection with optional programs override, returns userEvent instance and onRefresh spy

### Exports

- none

---

## NationalitiesSection.tsx

### Imports

- `react` — useState, SubmitEvent (type)
- `axios` — axios (used for `axios.isAxiosError` to detect 409 conflict on add)
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

- `FormState` (interface) — Internal form fields: countryCode, nationalIdNumber, passportNumber, passportIssueDate, passportExpiryDate, isPrimary
- `FormErrors` (interface) — Per-field validation error strings for nationalId, passport, passportNumber, passportDates
- `EMPTY_ERRORS` (const) — Zero-error FormErrors constant
- `makeEmptyForm` (function) — Returns blank FormState with optional isPrimary
- `passportStatusBadgeClass` (function) — Returns Tailwind class string for a PassportStatus badge
- `NationalityFormProps` (interface) — Props for the internal NationalityForm sub-component
- `NationalityForm` (component) — Internal add/edit form; country is read-only on edit; auto-fills passport expiry +10 years from issue date; validates passport fields are all-or-none
- `NationalitiesSectionProps` (interface) — Props: `data`, `onRefresh`
- `NationalitiesSection` (component) — List + inline add/edit/delete of nationalities; expandable per-row disclosure reveals VisasSubsection and EtasSubsection; handles 409 (duplicate) and 400 (delete primary) error codes

### Exports

- `NationalitiesSection` — named

---

## NationalitiesSection.test.tsx

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `@chamuco/shared-types` — PassportStatus
- `@/services/users.types` — NationalityDto (type)
- `./NationalitiesSection` — NationalitiesSection

### Definitions

- `mocks` (const) — Hoisted mock factories: mockPost, mockPatch, mockDelete, mockToastSuccess, mockToastError
- `sampleNationalities` (const) — Fixture array of two NationalityDto entries (one with passport, one OMITTED)
- `setup` (function) — Renders NationalitiesSection with optional nationalities override, returns userEvent instance and onRefresh spy

### Exports

- none

---

## NotificationPreferencesSection.tsx

### Imports

- `react` — useState
- `react-i18next` — useTranslation
- `@chamuco/shared-types` — DisabledNotificationChannels (type), NotificationChannel, NotificationType
- `@/components/ui/checkbox` — Checkbox
- `@/components/ui/toast` — toast
- `@/services/users.types` — NotificationPreferencesData (type)
- `@/services/users.service` — updateMyNotificationPreferences

### Definitions

- `NotificationPreferencesSectionProps` (interface) — Props: `preferences`
- `CONFIGURABLE_CHANNELS` (const) — Tuple of `[PUSH, EMAIL]` channels shown in the matrix
- `ConfigurableChannel` (type) — Extracted element type of `CONFIGURABLE_CHANNELS`
- `EMAIL_SUPPORTED` (const) — Set of NotificationTypes that support email channel
- `supportsChannel` (function) — Returns whether a given NotificationType supports a ConfigurableChannel
- `NotificationPreferencesSection` (component) — Table matrix of notification types × channels; each cell is a Checkbox; auto-saves on toggle via PATCH; optimistic update rolled back on error

### Exports

- `NotificationPreferencesSection` — named

---

## PersonalDetailsSection.tsx

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
- `@/lib/name-utils` — NAME_REGEX, normalizeName

### Definitions

- `PersonalDetailsSectionProps` (interface) — Props: `profile`, `onRefresh`
- `callingCodeToIso2` (function) — Converts `+XX` calling code to ISO2, falls back to `'CO'`
- `isValidCalendarDay` (function) — Validates that a day/month/year combination is a real calendar date
- `CURRENT_YEAR` (const) — Captured `new Date().getFullYear()` for DOB max-year validation
- `PersonalDetailsSection` (component) — Form for first name, last name, DOB (with year-visibility toggle), email, phone, birth location, and home location; validates all fields before patching `/v1/users/me/profile`

### Exports

- `PersonalDetailsSection` — named

---

## PersonalDetailsSection.test.tsx

### Imports

- `react` — ComponentProps (type)
- `@testing-library/react` — render, screen, waitFor, fireEvent
- `@testing-library/user-event` — userEvent
- `@/services/users.types` — PersonalDetailsProfile (type)
- `./PersonalDetailsSection` — PersonalDetailsSection

### Definitions

- `mocks` (const) — Hoisted mock factories: mockPatch, mockToastSuccess, mockToastError, mockIsValidPhoneNumber, mockGetCallingCode
- `setup` (function) — Renders PersonalDetailsSection with a profile fixture, returns userEvent instance and onRefresh spy

### Exports

- none

---

## PreferencesSection.tsx

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

- `PreferencesSectionProps` (interface) — Props: `preferences`, `onRefresh`
- `OptionButtonProps` (interface) — Generic props for OptionButton: value, current, label, saving, onClick
- `OptionButton` (component) — Generic pill toggle button for single-select preference fields; highlighted when active
- `PreferencesSection` (component) — Auto-save pill pickers for language, currency, and theme; calls `changeLanguage` after language save and `setTheme` after theme save

### Exports

- `PreferencesSection` — named

---

## PreferencesSection.test.tsx

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `./PreferencesSection` — PreferencesSection
- `@chamuco/shared-types` — AppLanguage, AppCurrency, AppTheme
- `@/services/users.types` — PreferencesData (type)

### Definitions

- `mocks` (const) — Hoisted mock factories: mockPatch, mockToastError, mockSetTheme, mockChangeLanguage
- `basePreferences` (const) — Fixture PreferencesData (EN, COP, SYSTEM)
- `setup` (function) — Renders PreferencesSection with optional overrides, returns userEvent instance and onRefresh spy

### Exports

- none

---

## VisasSubsection.tsx

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

- `FormState` (interface) — Internal form fields: coverageType, countryCode, visaZone, visaType, entries, expiryDate, notes
- `FormErrors` (interface) — Per-field validation error strings
- `EMPTY_ERRORS` (const) — Zero-error FormErrors constant
- `makeEmptyForm` (function) — Returns blank FormState
- `documentStatusBadgeClass` (function) — Returns Tailwind class string for a DocumentStatus badge
- `VisaFormProps` (interface) — Props for the internal VisaForm sub-component
- `VisaForm` (component) — Internal add/edit form; coverage type, country, and zone are read-only on edit; conditionally shows country or zone selector based on coverageType
- `VisasSubsectionProps` (interface) — Props: `nationalityId`
- `VisasSubsection` (component) — Fetches visas on mount via `getMyVisas`; manages add/edit/delete inline; separate `validate`/`validateEdit` functions (edit skips immutable coverage/country/zone fields); shows spinner while loading

### Exports

- `VisasSubsection` — named

---

## VisasSubsection.test.tsx

### Imports

- `@testing-library/react` — render, screen, waitFor
- `@testing-library/user-event` — userEvent
- `@chamuco/shared-types` — DocumentStatus, VisaCoverageType, VisaEntries, VisaType, VisaZone
- `./VisasSubsection` — VisasSubsection
- `@/services/users.types` — VisaDto (type)

### Definitions

- `mocks` (const) — Hoisted mock factories: mockGet, mockPost, mockPatch, mockDelete, mockToastSuccess, mockToastError
- `setup` (function) — Renders VisasSubsection for a given nationalityId, returns userEvent instance

### Exports

- none

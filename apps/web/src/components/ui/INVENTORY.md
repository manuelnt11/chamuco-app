# Inventory: ui

---

## announcement-card.test.tsx

### Imports

- `vitest` — `describe`, `it`, `expect`, `vi`, `afterEach` test utilities
- `@testing-library/react` — `render`, `screen`, `fireEvent`, `waitFor` render/query helpers
- `./announcement-card` — `AnnouncementCard` component under test

### Definitions

- `AnnouncementCard` tests (test suite) — verifies content rendering, overflow/collapse toggle, edit/delete callbacks, and `noCollapse` behavior

### Exports

None

---

## announcement-card.tsx

### Imports

- `react` — `useState`, `useEffect`, `useRef` state and side-effect hooks
- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@/components/ui/markdown-content` — `MarkdownContent` to render rich content
- `@/components/ui/edit-delete-actions` — `EditDeleteActions` icon-button pair

### Definitions

- `LINE_CLAMP` (const) — lookup table mapping line count to Tailwind `line-clamp-*` class
- `AnnouncementCardProps` (interface) — prop types for `AnnouncementCard`
- `AnnouncementCard` (component) — displays a single announcement with collapsible content, posted-by label, and optional edit/delete actions

### Exports

- `AnnouncementCard` — named

---

## announcement-form.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./announcement-form` — `AnnouncementForm` component under test

### Definitions

- `AnnouncementForm` tests (test suite) — verifies editor rendering, submit button state (empty, submitting), error display, and form submission

### Exports

None

---

## announcement-form.tsx

### Imports

- `react` — `SubmitEvent` type for form submission handler
- `@/components/ui/rich-text-editor` — `RichTextEditor` controlled markdown editor

### Definitions

- `AnnouncementFormProps` (interface) — prop types for `AnnouncementForm`
- `AnnouncementForm` (component) — form wrapping `RichTextEditor` with a submit button, optional error message, and loading/disabled state

### Exports

- `AnnouncementForm` — named

---

## avatar.test.tsx

### Imports

- `react` — `ComponentProps`, `ReactNode` for mock component types
- `@testing-library/react` — `render`, `screen` render/query helpers
- `vitest` — `describe`, `it`, `expect`

### Definitions

- `Avatar` tests (test suite) — verifies size variants, fallback, src rendering, `referrerPolicy`, and className forwarding

### Exports

None

---

## avatar.tsx

### Imports

- `react` — `ComponentPropsWithoutRef`, `ReactNode` component prop types
- `@base-ui/react/avatar` — `Avatar` as `AvatarPrimitive` headless avatar root, image, and fallback
- `class-variance-authority` — `cva`, `VariantProps` for variant-based class generation
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `avatarVariants` (const) — CVA definition with `sm`, `md`, `lg` size variants
- `AvatarProps` (interface) — extends `AvatarPrimitive.Root` props with `size`, `src`, `alt`, `fallback`
- `Avatar` (component) — circular avatar with image/fallback support and three size variants

### Exports

- `Avatar` — named
- `avatarVariants` — named
- `AvatarProps` — named (interface)

---

## badge.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `vitest` — `describe`, `it`, `expect`
- `./badge` — `Badge` component under test

### Definitions

- `Badge` tests (test suite) — verifies variant classes (default, secondary, destructive, outline), shape, and className forwarding

### Exports

None

---

## badge.tsx

### Imports

- `react` — `ComponentProps` for HTML element prop spreading
- `class-variance-authority` — `cva`, `VariantProps` for variant-based class generation
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `badgeVariants` (const) — CVA definition with `default`, `secondary`, `destructive`, `outline` variants
- `BadgeProps` (interface) — extends `ComponentProps<'span'>` with `VariantProps`
- `Badge` (component) — styled `<span>` pill for status/label display

### Exports

- `Badge` — named
- `badgeVariants` — named
- `BadgeProps` — named (interface)

---

## button.tsx

### Imports

- `@base-ui/react/button` — `Button` as `ButtonPrimitive` accessible button primitive
- `class-variance-authority` — `cva`, `VariantProps` for variant-based class generation
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `buttonVariants` (const) — CVA definition with `default`, `outline`, `secondary`, `ghost`, `destructive`, `link` variants and `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg` sizes
- `Button` (component) — polymorphic button using Base UI primitive with full variant/size support

### Exports

- `Button` — named
- `buttonVariants` — named

---

## card.tsx

### Imports

- `react` — `ComponentProps` for HTML element prop spreading
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `Card` (component) — root card container with `default`/`sm` size support
- `CardHeader` (component) — header region with grid layout for title + action slot
- `CardTitle` (component) — card heading text slot
- `CardDescription` (component) — muted subtitle text slot
- `CardAction` (component) — aligned action slot in the card header grid
- `CardContent` (component) — main content area with horizontal padding
- `CardFooter` (component) — footer row with muted background

### Exports

- `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardAction`, `CardDescription`, `CardContent` — named

---

## checkbox.tsx

### Imports

- `@base-ui/react/checkbox` — `Checkbox` as `CheckboxPrimitive` headless checkbox
- `@/lib/utils` — `cn` class merging helper
- `@phosphor-icons/react` — `CheckIcon` checkmark icon

### Definitions

- `Checkbox` (component) — styled checkbox using Base UI primitive with check indicator

### Exports

- `Checkbox` — named

---

## city-combobox.tsx

### Imports

- `react` — `useEffect`, `useState` hooks
- `react-i18next` — `useTranslation` for i18n default placeholder text
- `@/lib/utils` — `cn` class merging helper
- `@/components/ui/input` — `Input` text field
- `@/components/ui/spinner` — `Spinner` loading indicator
- `@/hooks/useCitySearch` — `useCitySearch` hook for debounced city search

### Definitions

- `CityComboboxProps` (interface) — prop types for `CityCombobox`; no `placeholder` prop — derived internally from `country` prop via i18n
- `CityCombobox` (component) — text input with dropdown autocomplete for city search; forces uppercase values; shows "Select a country first" hint when `country` is empty

### Exports

- `CityCombobox` — named

---

## command.tsx

### Imports

- `react` — `ComponentPropsWithoutRef` for component prop spreading
- `cmdk` — `Command` as `CommandPrimitive`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`, `CommandSeparator` headless command palette primitives
- `@phosphor-icons/react` — `MagnifyingGlassIcon` search icon
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `Command` (component) — wrapper for the `cmdk` root command palette
- `CommandSearch` (component) — search input row with magnifying glass icon
- `CommandItems` (component) — scrollable list container for command options
- `CommandNoResults` (component) — empty state message within the command palette
- `CommandGroupSection` (component) — labeled group of command options
- `CommandOption` (component) — individual selectable option row

### Exports

- `Command`, `CommandSearch`, `CommandItems`, `CommandNoResults`, `CommandGroupSection`, `CommandOption`, `CommandSeparator` — named

---

## country-combobox.tsx

### Imports

- `react` — `useMemo`, `useState` hooks
- `react-i18next` — `useTranslation` for locale detection
- `@phosphor-icons/react` — `CaretUpDownIcon`, `CheckIcon` icons
- `@/lib/utils` — `cn` class merging helper
- `@/lib/countries` — `buildCountryList`, `getCallingCodePrefix`, `getEmojiFlag`, `CountryEntry` country data utilities
- `@/components/ui/button` — `Button` trigger button
- `@/components/ui/popover` — `Popover`, `PopoverContent`, `PopoverTrigger` floating popover
- `@/components/ui/command` — `Command`, `CommandGroupSection`, `CommandItems`, `CommandNoResults`, `CommandOption`, `CommandSearch` command palette components

### Definitions

- `CountryComboboxProps` (interface) — prop types for `CountryCombobox`; supports `name` or `phone` display modes; no text override props — all default text resolved from i18n
- `CountryCombobox` (component) — country picker with emoji flag, name or dial-code display, and searchable popover command palette; full-width button; defaults resolved from `common:countryCombobox.*` i18n keys

### Exports

- `getCallingCode` (function) — named; convenience wrapper returning the calling-code prefix for an ISO2 code
- `CountryCombobox` — named

---

## crop-modal.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `act` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./crop-modal` — `CropModal` component under test

### Definitions

- `CropModal` tests (test suite) — verifies rendering, cancel/confirm actions, canvas blob output, double-tap prevention, pinch-to-zoom gesture handling, and object URL lifecycle

### Exports

None

---

## crop-modal.tsx

### Imports

- `react` — `useState`, `useRef`, `useEffect`, `SyntheticEvent` hooks and types
- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `react-image-crop` — `ReactCrop`, `centerCrop`, `makeAspectCrop`, `Crop`, `PixelCrop` image crop component and utilities

### Definitions

- `CropModalProps` (interface) — prop types for `CropModal`
- `CropModal` (component) — image crop UI with drag-crop, pinch-to-zoom via touch events, canvas blob output, and upload progress bar

### Exports

- `CropModal` — named

---

## date-of-birth-field.test.tsx

### Imports

- `react` — `ComponentProps` for mock component types
- `@testing-library/react` — `render`, `screen`, `fireEvent` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./date-of-birth-field` — `DateOfBirthField`, `DateOfBirthFieldProps` component and types under test

### Definitions

- `DateOfBirthField` tests (test suite) — verifies rendering, hidden date input value, individual input changes, calendar picker `showPicker`, `toYear` prop, and error/aria-invalid behavior

### Exports

None

---

## date-of-birth-field.tsx

### Imports

- `react` — `ChangeEvent`, `useId`, `useRef` hooks and types
- `@phosphor-icons/react` — `CalendarBlankIcon` calendar icon
- `@/components/ui/button` — `Button` calendar trigger
- `@/components/ui/field-message` — `FieldMessage` error/hint display
- `@/components/ui/input` — `Input` number input fields
- `@/components/ui/label` — `Label` field labels

### Definitions

- `DateOfBirthFieldProps` (interface) — separate `day`/`month`/`year` strings, change handlers, labels, and optional `toYear`/`error`/`disabled`
- `DateOfBirthField` (component) — three-column date-of-birth input backed by a hidden `<input type="date">` enabling native calendar picker integration

### Exports

- `DateOfBirthField` — named
- `DateOfBirthFieldProps` — named (interface)

---

## delete-confirm-button.tsx

### Imports

- `react` — `useEffect`, `useRef`, `useState` hooks
- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@phosphor-icons/react` — `TrashIcon` trash icon
- `@/components/ui/button` — `Button` styled button

### Definitions

- `DeleteConfirmButtonProps` (interface) — `onDelete` callback and optional `disabled`
- `DeleteConfirmButton` (component) — two-step delete: first click enters confirmation state, second click executes; outside `mousedown` cancels

### Exports

- `DeleteConfirmButton` — named

---

## dialog.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `vitest` — `describe`, `it`, `expect`
- `./dialog` — all dialog sub-components under test

### Definitions

- `Dialog` tests (test suite) — verifies open/close via trigger and close button, `defaultOpen`, title/description rendering, `DialogHeader`, and `DialogFooter`

### Exports

None

---

## dialog.tsx

### Imports

- `react` — `ComponentProps`, `ComponentPropsWithoutRef` component prop types
- `@base-ui/react/dialog` — `Dialog` as `DialogPrimitive` headless dialog primitives
- `@phosphor-icons/react` — `XIcon` close icon
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `Dialog` (const) — alias for `DialogPrimitive.Root`
- `DialogTrigger` (const) — alias for `DialogPrimitive.Trigger`
- `DialogBackdrop` (component) — internal blurred backdrop; always rendered by `DialogPopup`, not exported separately
- `DialogPopup` (component) — centered modal panel with enter/exit animations wrapping portal + backdrop + popup
- `DialogHeader` (component) — header container with flex-column layout
- `DialogFooter` (component) — footer container with responsive row/column layout
- `DialogTitle` (component) — styled heading using `DialogPrimitive.Title`
- `DialogDescription` (component) — muted description using `DialogPrimitive.Description`
- `DialogClose` (component) — absolute close button defaulting to `XIcon`

### Exports

- `Dialog`, `DialogTrigger`, `DialogPopup`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose` — named

---

## edit-delete-actions.tsx

### Imports

- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@phosphor-icons/react` — `PencilSimpleIcon` edit icon
- `@/components/ui/button` — `Button` styled button
- `@/components/ui/delete-confirm-button` — `DeleteConfirmButton` two-step delete button
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `EditDeleteActionsProps` (interface) — optional `onEdit`, `onDelete`, `disabled`, `className`
- `EditDeleteActions` (component) — icon-only edit and delete button pair; each button renders only when its callback is provided

### Exports

- `EditDeleteActions` — named

---

## empty-state.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `vitest` — `describe`, `it`, `expect`
- `./empty-state` — `EmptyState` component under test

### Definitions

- `EmptyState` tests (test suite) — verifies title, description, icon, action, dashed border styling, centering, and className forwarding

### Exports

None

---

## empty-state.tsx

### Imports

- `react` — `ComponentProps`, `ReactNode` component prop types
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `EmptyStateProps` (interface) — extends `ComponentProps<'div'>` with `icon`, `title`, `description`, `action` slots
- `EmptyState` (component) — centered dashed-border placeholder with optional icon, title, description, and action slot

### Exports

- `EmptyState` — named
- `EmptyStateProps` — named (interface)

---

## field-message.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `./field-message` — `FieldMessage` component under test

### Definitions

- `FieldMessage` tests (test suite) — verifies error vs. hint priority, null/undefined rendering, and className forwarding for each variant

### Exports

None

---

## field-message.tsx

### Imports

- `@/lib/utils` — `cn` class merging helper

### Definitions

- `FieldMessageProps` (interface) — `error`, `hint`, and `className` props
- `FieldMessage` (component) — renders a destructive error `<p>` or muted hint `<p>`; error takes precedence; returns `null` when neither is provided

### Exports

- `FieldMessage` — named

---

## file-upload-button.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `fireEvent`, `waitFor` render/query helpers
- `vitest` — `vi`, `describe`, `it`, `expect`, `beforeEach`
- `@chamuco/shared-types` — `UploadType` enum
- `./file-upload-button` — `FileUploadButton` component under test
- `@/hooks/useFileUpload` — `useFileUpload` hook (mocked)

### Definitions

- `FileUploadButton` tests (test suite) — verifies trigger label, progress bar, error/retry display, disabled states, `onSuccess`/`onError` callbacks, and reset behavior

### Exports

None

---

## file-upload-button.tsx

### Imports

- `react` — `useRef`, `ReactNode`, `ChangeEvent` hooks and types
- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@chamuco/shared-types` — `UploadType` enum
- `@/lib/utils` — `cn` class merging helper
- `@/hooks/useFileUpload` — `useFileUpload` upload orchestration hook

### Definitions

- `ACCEPTED_TYPES` (const) — maps each `UploadType` to an accepted MIME type string for the hidden file input
- `FileUploadButtonProps` (interface) — `uploadType`, `contextId`, `onSuccess`, `onError`, `children`, `className`, `disabled`
- `FileUploadButton` (component) — file picker button with hidden input, upload progress bar, and retry error display; drives direct-to-GCS upload via `useFileUpload`

### Exports

- `FileUploadButton` — named
- `FileUploadButtonProps` — named (interface)
- `UploadType` — named (re-export from `@chamuco/shared-types`)

---

## group-autocomplete.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./group-autocomplete` — `GroupAutocomplete` component under test
- `@/types/group` — `Group`, `GroupSearchResult` types
- `@chamuco/shared-types` — `GroupVisibility`, `MembershipStatus` enums

### Definitions

- `GroupAutocomplete` tests (test suite) — verifies dropdown visibility, loading spinner, empty state, my-groups/public-groups sections, selection callback with `isMyGroup` flag, and `excludedIds` filtering

### Exports

None

---

## group-autocomplete.tsx

### Imports

- `react` — `useState`, `KeyboardEvent` hooks and types
- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@/lib/utils` — `cn` class merging helper
- `@/components/ui/input` — `Input` text field
- `@/components/ui/spinner` — `Spinner` loading indicator
- `@/hooks/useGroupPickerSearch` — `useGroupPickerSearch` hook for my/public group search
- `@/types/group` — `Group`, `GroupSearchResult` local types

### Definitions

- `GroupPickerItem` (type) — union of `Group | GroupSearchResult` extended with `isMyGroup: boolean`
- `GroupAutocompleteProps` (interface) — prop types for `GroupAutocomplete`
- `GroupAutocomplete` (component) — text input with sectioned dropdown (my groups / public groups), keyboard navigation, and `excludedIds` support
- `GroupItemProps` (interface) — prop types for the internal `GroupItem` row
- `GroupItem` (component) — individual group row with thumbnail, name, and keyboard-active highlight

### Exports

- `GroupAutocomplete` — named
- `GroupAutocompleteProps` — named (type)
- `GroupPickerItem` — named (type)

---

## input.tsx

### Imports

- `react` — `ComponentProps` for HTML element prop spreading
- `@base-ui/react/input` — `Input` as `InputPrimitive` accessible input primitive
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `Input` (component) — styled text input delegating to Base UI `InputPrimitive` with full aria/validation/disabled class support

### Exports

- `Input` — named

---

## label.tsx

### Imports

- `react` — `ComponentProps` for HTML element prop spreading
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `Label` (component) — styled `<label>` with peer-disabled and group-disabled pointer-events/opacity support

### Exports

- `Label` — named

---

## loyalty-program-combobox.test.tsx

### Imports

- `react` — `ComponentProps` for mock component types
- `@testing-library/react` — `render`, `screen`, `fireEvent` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./loyalty-program-combobox` — `LoyaltyProgramCombobox` component under test

### Definitions

- `LoyaltyProgramCombobox` tests (test suite) — verifies rendering, dropdown visibility, suggestion filtering/capping at 8, selection, blur/focus lifecycle, and external value sync

### Exports

None

---

## loyalty-program-combobox.tsx

### Imports

- `react` — `useEffect`, `useRef`, `useState` hooks
- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@chamuco/shared-types` — `LOYALTY_PROGRAM_SUGGESTIONS`, `LoyaltyProgramCategory` suggestions data and category type
- `@/components/ui/input` — `Input` text field

### Definitions

- `LoyaltyProgramComboboxProps` (interface) — `id`, `value`, `onChange`, `required`, `maxLength`, `disabled`
- `LoyaltyProgramCombobox` (component) — free-text input with a dropdown showing up to 8 matching loyalty program suggestions from a static list

### Exports

- `LoyaltyProgramCombobox` — named

---

## markdown-content.test.tsx

### Imports

- `vitest` — `describe`, `it`, `expect`
- `@testing-library/react` — `render`, `screen` render/query helpers
- `./markdown-content` — `MarkdownContent` component under test

### Definitions

- `MarkdownContent` tests (test suite) — verifies plain text, bold/italic/lists/blockquote/code rendering, className merging, `prose-content` class, and URL safety transform (https, mailto, javascript:, data:, relative, anchor)

### Exports

None

---

## markdown-content.tsx

### Imports

- `react-markdown` — `ReactMarkdown` Markdown-to-React renderer
- `remark-gfm` — `remarkGfm` GFM (tables, strikethrough, task lists) plugin

### Definitions

- `ALLOWED_PROTOCOLS` (const) — whitelist `['http:', 'https:', 'mailto:']` for URL sanitization
- `safeUrlTransform` (function) — replaces any URL whose protocol is not in `ALLOWED_PROTOCOLS` with `#`
- `MarkdownContent` (component) — renders a Markdown string with GFM support and safe URL transform inside a `.prose-content` wrapper

### Exports

- `MarkdownContent` — named

---

## menu.tsx

### Imports

- `react` — `ComponentProps`, `ComponentPropsWithoutRef` component prop types
- `@base-ui/react/menu` — `Menu` as `MenuPrimitive` headless dropdown menu primitives
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `MenuRoot` (const) — alias for `MenuPrimitive.Root`
- `MenuTrigger` (const) — alias for `MenuPrimitive.Trigger`
- `MenuPopup` (component) — positioned dropdown popup with enter/exit scale/fade animations
- `MenuItem` (component) — interactive menu item row with hover/focus styles and disabled support
- `MenuSeparator` (component) — `<hr>` visual divider between menu groups
- `MenuLabel` (component) — non-interactive section label inside the menu

### Exports

- `MenuRoot`, `MenuTrigger`, `MenuPopup`, `MenuItem`, `MenuSeparator`, `MenuLabel` — named

---

## phone-input.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./phone-input` — `PhoneInput`, `cleanPhoneNumber`, `isPhoneValid`, `parsePastedPhoneNumber` under test

### Definitions

- `cleanPhoneNumber` tests (test suite) — verifies whitespace stripping (leading, trailing, internal, tabs)
- `isPhoneValid` tests (test suite) — verifies delegation to `libphonenumber-js` and pre-stripping of spaces
- `PhoneInput` tests (test suite) — verifies rendering, field integration, error states, paste-split behavior, and disabled
- `parsePastedPhoneNumber` tests (test suite) — verifies prefix matching, longest-prefix-first ordering, stripping punctuation, and null on invalid input

### Exports

None

---

## phone-input.tsx

### Imports

- `react` — `useId`, `ClipboardEvent` hooks and types
- `libphonenumber-js` — `isValidPhoneNumber`, `getCountries`, `getCountryCallingCode`, `CountryCode` phone validation and metadata
- `@/components/ui/input` — `Input` text field
- `@/components/ui/label` — `Label` sr-only number label
- `@/components/ui/country-combobox` — `CountryCombobox` country selector
- `@/components/ui/field-message` — `FieldMessage` error display

### Definitions

- `PHONE_PREFIXES` (const) — ISO2/prefix pairs sorted longest-first for accurate paste detection
- `cleanPhoneNumber` (function) — strips all whitespace from a phone number string
- `isPhoneValid` (function) — validates a local number + ISO2 pair using `libphonenumber-js`
- `parsePastedPhoneNumber` (function) — parses an international `+XX...` pasted string into `{ iso2, nationalNumber }` or `null`
- `PhoneInput` (component) — country code combobox + local number field with paste-detection, sr-only label, and error display

### Exports

- `PhoneInput` — named
- `cleanPhoneNumber` — named
- `isPhoneValid` — named
- `parsePastedPhoneNumber` — named

---

## popover.tsx

### Imports

- `react` — `ComponentProps` for HTML element prop spreading
- `@base-ui/react/popover` — `Popover` as `PopoverPrimitive` headless popover primitives
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `Popover` (component) — wrapper for `PopoverPrimitive.Root`
- `PopoverTrigger` (component) — wrapper for `PopoverPrimitive.Trigger`
- `PopoverContent` (component) — positioned floating panel with slide-in animations and configurable `align`/`side`/`sideOffset`
- `PopoverHeader` (component) — header container with flex-column layout
- `PopoverTitle` (component) — title text using `PopoverPrimitive.Title`
- `PopoverDescription` (component) — description text using `PopoverPrimitive.Description`

### Exports

- `Popover`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger` — named

---

## rich-text-editor.test.tsx

### Imports

- `vitest` — `describe`, `it`, `expect`, `vi`, `Mock` test utilities
- `@testing-library/react` — `render`, `screen`, `fireEvent` render/query helpers
- `./rich-text-editor` — `RichTextEditor` component under test

### Definitions

- `RichTextEditor` tests (test suite) — verifies toolbar button rendering, character count display, disabled state, `onChange` markdown output, bold/emoji/table interactions, table picker close, and emoji insertion

### Exports

None

---

## rich-text-editor.tsx

### Imports

- `react` — `useState`, `useEffect`, `useRef`, `ReactNode` hooks and types
- `@tiptap/react` — `useEditor`, `EditorContent` Tiptap editor hook and content component
- `@tiptap/starter-kit` — `StarterKit` base Tiptap extensions bundle
- `@tiptap/extension-placeholder` — `Placeholder` placeholder text extension
- `@tiptap/extension-character-count` — `CharacterCount` character limit extension
- `tiptap-markdown` — `Markdown` Markdown serialization/deserialization extension
- `@tiptap/extension-table` — `Table` table extension
- `@tiptap/extension-table-row` — `TableRow` table row extension
- `@tiptap/extension-table-header` — `TableHeader` table header cell extension
- `@tiptap/extension-table-cell` — `TableCell` table body cell extension
- `@emoji-mart/react` — `Picker` emoji picker component
- `@emoji-mart/data` — `data` emoji dataset
- `next-themes` — `useTheme` for dark/light theme detection
- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@phosphor-icons/react` — `TextBIcon`, `TextItalicIcon`, `TextHOneIcon`, `TextHTwoIcon`, `TextHThreeIcon`, `ListBulletsIcon`, `ListNumbersIcon`, `QuotesIcon`, `CodeIcon`, `SmileyIcon`, `TableIcon` toolbar icons

### Definitions

- `TableSizePicker` (component) — 6×6 hover-to-select grid for choosing table dimensions before insertion
- `ToolbarButton` (component) — individual toolbar icon button with active/disabled visual states
- `EmojiData` (interface) — minimal type for emoji-mart selection payload (`native: string`)
- `RichTextEditorProps` (interface) — `value`, `onChange`, `placeholder`, `maxLength`, `disabled`
- `RichTextEditor` (component) — Tiptap-powered Markdown editor with heading/bold/italic/lists/blockquote/code/table/emoji toolbar and live character count

### Exports

- `RichTextEditor` — named

---

## save-button.test.tsx

### Imports

- `react` — `ComponentProps` for mock component types
- `@testing-library/react` — `render`, `screen` render/query helpers
- `./save-button` — `SaveButton` component under test

### Definitions

- `SaveButton` tests (test suite) — verifies label rendering, disabled/enabled states, spinner visibility, unsaved indicator, and submit button type

### Exports

None

---

## save-button.tsx

### Imports

- `react` — `ComponentPropsWithoutRef` component prop types
- `@/components/ui/button` — `Button` base button
- `@/components/ui/spinner` — `Spinner` loading indicator
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `SaveButtonProps` (interface) — extends `Button` props (excluding `children`, `disabled`, `type`) with `isSaving`, `isDirty`, `label`
- `SaveButton` (component) — submit button showing a spinner when saving, an amber dot indicator when dirty, and disabled when clean or actively saving

### Exports

- `SaveButton` — named

---

## select.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `vitest` — `describe`, `it`, `expect`
- `./select` — `Select` component under test

### Definitions

- `Select` tests (test suite) — verifies element type, `data-slot`, children options, className forwarding, disabled state, and value/onChange forwarding

### Exports

None

---

## select.tsx

### Imports

- `react` — `ComponentProps` for HTML element prop spreading
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `Select` (component) — styled native `<select>` with consistent border/ring/disabled classes matching the design system

### Exports

- `Select` — named

---

## separator.tsx

### Imports

- `@base-ui/react/separator` — `Separator` as `SeparatorPrimitive` headless separator
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `Separator` (component) — horizontal or vertical divider line using Base UI `SeparatorPrimitive`

### Exports

- `Separator` — named

---

## spinner.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `vitest` — `describe`, `it`, `expect`
- `./spinner` — `Spinner` component under test

### Definitions

- `Spinner` tests (test suite) — verifies SVG element, `role="status"`, default/custom `aria-label`, `data-slot`, `animate-spin`, size variants, and className forwarding

### Exports

None

---

## spinner.tsx

### Imports

- `react` — `ComponentPropsWithoutRef` for SVG prop spreading
- `class-variance-authority` — `cva`, `VariantProps` for variant-based class generation
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `spinnerVariants` (const) — CVA definition with `sm`, `md`, `lg` size variants
- `SpinnerProps` (interface) — extends `ComponentPropsWithoutRef<'svg'>` with `size` and `label`
- `Spinner` (component) — accessible spinning SVG with `role="status"` and configurable `aria-label`

### Exports

- `Spinner` — named
- `spinnerVariants` — named
- `SpinnerProps` — named (interface)

---

## textarea.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `vitest` — `describe`, `it`, `expect`
- `./textarea` — `Textarea` component under test

### Definitions

- `Textarea` tests (test suite) — verifies element type, `data-slot`, base styling classes, min-height, and className/placeholder/disabled/rows/value forwarding

### Exports

None

---

## textarea.tsx

### Imports

- `react` — `ComponentProps` for HTML element prop spreading
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `Textarea` (component) — styled `<textarea>` with consistent border/ring/disabled/validation classes matching the design system

### Exports

- `Textarea` — named

---

## timezone-combobox.tsx

### Imports

- `react` — `useState` hook
- `@phosphor-icons/react` — `CaretUpDownIcon`, `CheckIcon` icons
- `@/lib/utils` — `cn` class merging helper
- `@/components/ui/button` — `Button` trigger button
- `@/components/ui/popover` — `Popover`, `PopoverContent`, `PopoverTrigger` floating popover
- `@/components/ui/command` — `Command`, `CommandGroupSection`, `CommandItems`, `CommandNoResults`, `CommandOption`, `CommandSearch` command palette components
- `@/lib/timezones` — `TIMEZONES`, `formatTimezoneLabel` timezone list and label formatter

### Definitions

- `TimezoneComboboxProps` (interface) — `value`, `onChange`, placeholder texts, `className`, `disabled`, aria attributes
- `TimezoneCombobox` (component) — searchable timezone picker using popover + command palette; displays a formatted label for the selected timezone

### Exports

- `TimezoneCombobox` — named

---

## toast.test.tsx

### Imports

- `react` — `ReactNode` for provider wrapper helper
- `@testing-library/react` — `render`, `screen`, `act`, `cleanup` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `vitest` — `describe`, `it`, `expect`, `afterEach`, `vi`
- `./toast` — `ToastProvider`, `toast`, `toastManager` under test

### Definitions

- `ToastProvider` tests (test suite) — verifies children rendering
- `toast manager` tests (test suite) — verifies `show`/`success`/`error`/`warning`/`info` helpers, dismiss button, and `toast.dismiss(id)`

### Exports

None

---

## toast.tsx

### Imports

- `react` — `ComponentPropsWithoutRef` component prop types
- `@base-ui/react/toast` — `Toast` as `ToastPrimitive` headless toast primitives
- `class-variance-authority` — `cva` for variant-based class generation
- `@phosphor-icons/react` — `CheckCircleIcon`, `InfoIcon`, `WarningIcon`, `XCircleIcon`, `XIcon` status and close icons
- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `ToastProvider` (component) — root provider wrapping app content; internally mounts `Toaster`
- `toastVariants` (const) — CVA definition for `default`, `success`, `error`, `warning`, `info` type variants
- `typeIconMap` (const) — maps toast type string to its colored icon element
- `Toaster` (component) — internal viewport rendering all active toasts (not intended for direct use outside `ToastProvider`)
- `toast` (const) — convenience API with `show`, `success`, `error`, `warning`, `info`, and `dismiss` methods wrapping the global manager

### Exports

- `toastManager` — named (Base UI singleton toast manager)
- `toast` — named (convenience helpers object)
- `ToastProvider` — named
- `Toaster` — named

---

## user-autocomplete.test.tsx

### Imports

- `react` — `ComponentProps`, `ReactNode` for mock component types
- `@testing-library/react` — `render`, `screen`, `waitFor` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./user-autocomplete` — `UserAutocomplete` component under test
- `@/types/user` — `UserSearchResult` type

### Definitions

- `UserAutocomplete` tests (test suite) — verifies dropdown visibility, spinner, empty state, result items with display name and username, `onSelect`/`onChange` callbacks, keyboard navigation (ArrowDown, Enter, Escape), and `@`-only query suppression

### Exports

None

---

## user-autocomplete.tsx

### Imports

- `react` — `useState`, `KeyboardEvent` hooks and types
- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@/lib/utils` — `cn` class merging helper
- `@/components/ui/avatar` — `Avatar` user avatar
- `@/components/ui/input` — `Input` text field
- `@/components/ui/spinner` — `Spinner` loading indicator
- `@/hooks/useUserSearch` — `useUserSearch` hook for debounced user search
- `@/types/user` — `UserSearchResult` local type

### Definitions

- `UserAutocompleteProps` (interface) — `value`, `onChange`, `onSelect`, `placeholder`, `className`, `aria-invalid`, `data-testid`
- `UserAutocomplete` (component) — text input with dropdown showing user results (avatar, display name, @username); supports keyboard navigation (ArrowDown, ArrowUp, Enter, Escape) and clears value on selection

### Exports

- `UserAutocomplete` — named
- `UserAutocompleteProps` — named (type)

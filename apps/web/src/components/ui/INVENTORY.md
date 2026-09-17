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

## city-combobox.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./city-combobox` — `CityCombobox` component under test
- `@/hooks/useCitySearch` — mocked to control `results`/`isLoading` deterministically

### Definitions

- `CityCombobox` tests (test suite) — verifies placeholder text (country set vs empty), uppercased trigger value, type-to-search/loading/no-results states, rendered result rows, selection closing the popover, clearing the search calling `onChange('')`, `disabled` disabling the trigger, and the stale-search-query fix (typing without selecting, closing, and reopening resets the search box to the committed `value`)

### Exports

- None (test file)

---

## city-combobox.tsx

### Imports

- `react` — `useEffect`, `useState` hooks
- `react-i18next` — `useTranslation` for i18n default placeholder text
- `@/lib/utils` — `cn` class merging helper
- `@/components/ui/button` — `Button` trigger button
- `@/components/ui/combobox-popover` — `ComboboxPopover` shared Popover+Command wiring
- `@/components/ui/command` — `CommandOption` individual option row
- `@/components/ui/select-item` — `SelectItem` shared icon/label/selected-state item renderer
- `@/hooks/useCitySearch` — `useCitySearch` hook for debounced city search

### Definitions

- `CityComboboxProps` (interface) — prop types for `CityCombobox`; `disabled`; no `placeholder` prop — derived internally from `country` prop via i18n
- `CityCombobox` (component) — searchable popover combobox for city search built on `ComboboxPopover`; forces uppercase values; shows "Select a country first" hint when `country` is empty; drives `ComboboxPopover`'s controlled `searchValue`/`onSearchValueChange`/`shouldFilter={false}`/`isLoading` props since results are server-filtered; shows a context-aware no-results message (type-to-search hint below 2 chars, "no cities found" otherwise); forwards `disabled` to both the trigger `Button` and `ComboboxPopover`; also passes `onOpenChange` to reset the local search `query` back to the committed `value` whenever the popover reopens, so typing without selecting and closing doesn't leave a stale query pre-filled on the next open

### Exports

- `CityCombobox` — named

---

## combobox-popover.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `within` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./combobox-popover` — `ComboboxPopover` component under test
- `@/components/ui/button` — `Button` used as the test trigger element
- `@/components/ui/command` — `CommandOption` used to render test options

### Definitions

- `ComboboxPopover` tests (test suite) — verifies trigger rendering, open/close on click and on `disabled`, search placeholder/accessible name, no-results text, `onSelect`+`close()`, content width, plus `searchable={false}` visually hiding (not removing) the search box, `isLoading` showing a spinner in place of options, controlled `searchValue`/`onSearchValueChange`, `shouldFilter={false}` keeping externally pre-filtered options visible, `maxLength` forwarding to the search input, `onOpenChange` firing on both trigger-driven open and `close()`-driven selection-close, and — the keyboard-accessibility fix — `searchable={false}` still lands focus on the (hidden) search input so `ArrowDown`+`Enter` navigates and selects options, with typed text never filtering the list (forced `shouldFilter={false}` internally in that case)

### Exports

- None (test file)

---

## combobox-popover.tsx

### Imports

- `react` — `useEffect`, `useState` hooks, `ReactElement`, `ReactNode` types
- `@/lib/utils` — `cn` class merging helper
- `@/components/ui/popover` — `Popover`, `PopoverContent`, `PopoverTrigger` floating popover
- `@/components/ui/command` — `Command`, `CommandGroupSection`, `CommandItems`, `CommandLoading`, `CommandNoResults`, `CommandSearch` command palette components

### Definitions

- `ComboboxPopoverProps` (interface) — prop types for `ComboboxPopover`; `trigger`/`triggerChildren` split mirrors `PopoverTrigger`'s `render` composition; `children` is a render-prop receiving `close()` so single-select callers can close the popover on select while multi-select callers can ignore it; `searchable` (default `true`) toggles the search box's _visibility_ only — `CommandSearch` is always rendered (see `command.tsx`) so cmdk's own keyboard-nav always has a focusable descendant, and `shouldFilter` is forced `false` whenever `searchable` is `false` regardless of the prop's own value, so a hidden/keyboard-only-focused input never filters the list; `searchValue`/`onSearchValueChange` externally control the search input (for async/free-text consumers); `onOpenChange` notifies the caller of every open/close transition, including a `close()`-driven selection close (which is a direct state set, not something Base UI's own `Popover.onOpenChange` fires on) — used by `city-combobox.tsx` to reset its stale search query on reopen; `shouldFilter` (default `true`, only honored when `searchable`) forwards to `cmdk`'s own substring filter, set `false` when the caller pre-filters; `maxLength` forwards to the search input; `isLoading` swaps the option list for `CommandLoading`
- `ComboboxPopover` (component) — shared `Popover` + `Command` wiring used by `select.tsx`, `free-text-combobox.tsx`, `country-combobox.tsx`, `timezone-combobox.tsx`, `multi-select.tsx`, and `city-combobox.tsx`; owns open state, closes automatically when `disabled` becomes true while open, and sets `Command`'s `label` prop (used internally by `cmdk` for the search input's `aria-labelledby`) so the search box always has an accessible name even though only a `placeholder` is visually shown

### Exports

- `ComboboxPopover` — named

---

## command.tsx

### Imports

- `react` — `ComponentPropsWithoutRef` for component prop spreading
- `cmdk` — `Command` as `CommandPrimitive`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`, `CommandSeparator` headless command palette primitives
- `@phosphor-icons/react` — `MagnifyingGlassIcon` search icon
- `@/lib/utils` — `cn` class merging helper
- `@/components/ui/spinner` — `Spinner` used by `CommandLoading`

### Definitions

- `Command` (component) — wrapper for the `cmdk` root command palette
- `CommandSearch` (component) — search input row with magnifying glass icon; accepts `visuallyHidden?: boolean`, which applies `sr-only` to the wrapper div (icon + input) so the row disappears visually while the `<input>` stays in the DOM and focusable — `ComboboxPopover` always renders this now (never conditionally omits it) so cmdk's own tested keyboard-nav (ArrowUp/ArrowDown/Enter, attached to the `cmdk-root` div) has a legitimate focusable descendant even when the field isn't meant to show a visible search box
- `CommandItems` (component) — scrollable list container for command options
- `CommandNoResults` (component) — empty state message within the command palette
- `CommandLoading` (component) — centered `Spinner` row shown in place of the option list while loading; used by `combobox-popover.tsx`'s `isLoading` branch instead of an inline duplicate
- `CommandGroupSection` (component) — labeled group of command options
- `CommandOption` (component) — individual selectable option row; always calls `e.preventDefault()` on `onMouseDown` so clicking an option never blurs a still-focused search/autocomplete input before its `onSelect` fires (the previous plain `<div onClick>`-based dropdowns in `user-autocomplete.tsx`/`group-autocomplete.tsx` lost this on their refactor to cmdk, since `CommandItem` doesn't do it itself)
- `buildFilterValue` (function) — `(...parts: string[]) => string`, joins parts with a space; cmdk filters by matching typed text against `CommandItem`'s `value` string (not its rendered children), so callers fold every searchable field (label, code, etc.) into one string via this helper instead of hand-rolling the concat — used by `select.tsx`, `multi-select.tsx`, `country-combobox.tsx`

### Exports

- `Command`, `CommandSearch`, `CommandItems`, `CommandNoResults`, `CommandLoading`, `CommandGroupSection`, `CommandOption`, `CommandSeparator`, `buildFilterValue` — named

---

## country-combobox.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./country-combobox` — `CountryCombobox` component under test

### Definitions

- `CountryCombobox` tests (test suite) — real, unmocked `ComboboxPopover`/cmdk (with `ResizeObserver`/`scrollIntoView` stubs); verifies placeholder text when empty, selected country name/flag rendering, dial-code label in `phone` display mode, `onChange` on option selection, and `disabled` disabling the trigger

### Exports

- None (test file)

---

## country-combobox.tsx

### Imports

- `react` — `useMemo` hook
- `react-i18next` — `useTranslation` for locale detection
- `@/lib/utils` — `cn` class merging helper
- `@/lib/countries` — `buildCountryList`, `getCallingCodePrefix`, `getEmojiFlag`, `CountryEntry` country data utilities
- `@/components/ui/button` — `Button` trigger button
- `@/components/ui/combobox-popover` — `ComboboxPopover` shared Popover+Command wiring
- `@/components/ui/command` — `buildFilterValue`, `CommandOption` filter-string helper and individual option row
- `@/components/ui/select-item` — `ComboboxTriggerContent`, `SelectItem` shared trigger body and icon/label/selected-state item renderer

### Definitions

- `CountryComboboxProps` (interface) — prop types for `CountryCombobox`; supports `name` or `phone` display modes; `disabled`; no text override props — all default text resolved from i18n
- `CountryCombobox` (component) — country picker with emoji flag, name or dial-code display, and searchable popover command palette; full-width button; defaults resolved from `common:countryCombobox.*` i18n keys; trigger body shares `ComboboxTriggerContent` with `select.tsx`; option rows render via `SelectItem` (flag icon + selected checkmark), keeping its own bespoke two-part phone-mode label (dial code + country name) since that doesn't fit `Select`'s single-label option model

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

## free-text-combobox.test.tsx

### Imports

- `react` — `useState` for the controlled test harness
- `@testing-library/react` — `render`, `screen` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./free-text-combobox` — `FreeTextCombobox`, `FreeTextComboboxOption` under test

### Definitions

- `ControlledFreeTextCombobox` (test helper component) — wraps `FreeTextCombobox` with local `useState` so typing/selecting behaves like a real controlled consumer (a bare `vi.fn()` `onChange` alone would make the underlying `cmdk` input visually reset after each keystroke)
- `FreeTextCombobox` tests (test suite) — verifies placeholder/value display, showing all options when empty, subtitle rendering, `onChange` per keystroke (with and without `transformInput`), substring filtering, `noResultsText`, `maxSuggestions` capping, selection applying `transformInput` and closing the popover, `maxLength` forwarding, `disabled` forwarding to the trigger, and `disabled` flipping to `true` while open closing the popover (via `ComboboxPopover`, not just the trigger)

### Exports

- None (test file)

---

## free-text-combobox.tsx

### Imports

- `@/lib/utils` — `cn` class merging helper
- `@/components/ui/button` — `Button` trigger button
- `@/components/ui/combobox-popover` — `ComboboxPopover` shared Popover+Command wiring
- `@/components/ui/command` — `CommandOption` individual option row
- `@/components/ui/select-item` — `SelectItem` shared icon/label/selected-state item renderer

### Definitions

- `FreeTextComboboxOption` (interface) — `{ value, label, subtitle? }` plain option data shape
- `FreeTextComboboxProps` (interface) — `id`, `value`, `onChange`, `options` (full unfiltered list — the component filters+caps internally), `placeholder`, `noResultsText`, `maxSuggestions?`, `transformInput?` (e.g. uppercase, applied uniformly to both typing and selecting), `maxLength?`, `disabled`, `className`, `contentClassName`, `data-testid`, `aria-invalid`
- `FreeTextCombobox` (component) — shared "free-text popover combobox over a static, synchronously-filtered option list" primitive extracted from `loyalty-program-combobox.tsx` and `EmergencyContactsSection.tsx`'s `RelationshipCombobox` (both hand-rolled this pattern independently before this extraction); fully controlled — `value` is passed straight through as `ComboboxPopover`'s `searchValue`, no local query state to keep in sync; forwards `disabled` to both the trigger `Button` and `ComboboxPopover` (so the popover auto-closes when a consumer disables the field while it's open); `CityCombobox` intentionally stays separate since it's driven by an external async/debounced hook with its own loading state, a meaningfully different shape

### Exports

- `FreeTextCombobox` — named
- `FreeTextComboboxOption` — named (interface)

---

## group-autocomplete.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./group-autocomplete` — `GroupAutocomplete` component under test
- `@/types/group` — `Group`, `GroupSearchResult` types
- `@chamuco/shared-types` — `GroupVisibility`, `MembershipStatus` enums

### Definitions

- `GroupAutocomplete` tests (test suite) — real (unmocked) `InlineCombobox`/`cmdk`; verifies dropdown visibility (`role="combobox"`/`"listbox"`, not the old plain `"textbox"`/`"list"`), loading spinner, empty state, my-groups/public-groups headed sections, selection callback with `isMyGroup` flag, `excludedIds` filtering, keyboard nav (`Escape` closes, `ArrowDown`+`Enter` selects — previously untested), `disabled` disabling the input, and `disabled` flipping to `true` while open closing the dropdown

### Exports

- None (test file)

---

## group-autocomplete.tsx

### Imports

- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@/components/ui/command` — `CommandGroupSection`, `CommandOption` group/option row primitives
- `@/components/ui/inline-combobox` — `InlineCombobox`, `useInlineComboboxOpenState` shared always-visible-input combobox shell and open-state hook
- `@/hooks/useGroupPickerSearch` — `useGroupPickerSearch` hook for my/public group search
- `@/types/group` — `Group`, `GroupSearchResult` local types

### Definitions

- `GroupPickerItem` (type) — union of `Group | GroupSearchResult` extended with `isMyGroup: boolean`
- `GroupAutocompleteProps` (interface) — prop types for `GroupAutocomplete`
- `GroupAutocomplete` (component) — rebuilt on `InlineCombobox`: two `CommandGroupSection`s (My groups / Public groups, each with a `heading`) of `CommandOption` rows; no more manual `activeIndex`/`flatItems`/`itemOffset` bookkeeping — cmdk's own `Command` root handles arrow-key/Enter navigation across both groups, and `CommandItem`'s `role="option"`/`aria-selected` (plus the input's `role="combobox"`) replace the old hand-rolled, ARIA-less dropdown
- `GroupItemProps` (interface) — prop types for the internal `GroupItem` row
- `GroupItem` (component) — pure presentational group row (cover thumbnail + name); no longer takes `isActive`/`onMouseDown` — `CommandOption`'s own `data-[selected=true]:bg-muted` styling and `onSelect` handle that

### Exports

- `GroupAutocomplete` — named
- `GroupAutocompleteProps` — named (type)
- `GroupPickerItem` — named (type)

---

## inline-combobox.test.tsx

### Imports

- `react` — `useState` for a controlled-close test harness
- `@testing-library/react` — `render`, `screen`, `waitFor` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./inline-combobox` — `InlineCombobox` component under test
- `@/components/ui/command` — `CommandOption` used to render test options

### Definitions

- `InlineCombobox` tests (test suite) — verifies the input renders with its placeholder, the panel is hidden when `open` is `false` and shown when `true`, `onValueChange`/`onFocus` fire, `isLoading` shows `CommandLoading`, `noResultsText` shows when there are no option children, `Escape` and blur (after its delay) call `onClose`, `disabled` hides the panel even when `open` and disables the input, a `CommandOption`'s `onSelect` receiving the render-prop's `close` callback closes the panel, Enter does **not** call `preventDefault` while the panel is closed (so a surrounding `<form>` can still submit on Enter), Enter still lets cmdk select the highlighted option while open, and clicking an option keeps the input focused instead of blurring it

### Exports

- None (test file)

---

## inline-combobox.tsx

### Imports

- `react` — `useState`, `KeyboardEvent`, `ReactNode`
- `cmdk` — `CommandInput` (used directly, not via `CommandSearch` — that wrapper's icon + bottom-border-only row styling is for the inside of a `ComboboxPopover`; here the input is the field itself)
- `@/lib/utils` — `cn` class merging helper
- `@/components/ui/command` — `Command`, `CommandItems`, `CommandLoading`, `CommandNoResults` cmdk primitives
- `@/components/ui/input` — `inputClassName` so the standalone `CommandInput` matches `Input`'s look

### Definitions

- `InlineComboboxProps` (interface) — sibling to `ComboboxPopoverProps` for the "input is always visible, dropdown appears inline below it" shape (vs. `ComboboxPopover`'s "closed button → floating popover"); `open`/`onFocus`/`onClose` are fully controlled by the caller (visibility policy — minimum length, `UserAutocomplete`'s `@`-only edge case, etc. — stays per-consumer); `children: (close) => ReactNode` mirrors `ComboboxPopover`'s render-prop, and is **not** pre-wrapped in a single `CommandGroupSection` the way `ComboboxPopover` wraps its children — callers render as many sibling `CommandGroupSection`s (with or without a `heading`) as they need
- `InlineCombobox` (component) — shared shell used by `user-autocomplete.tsx` and `group-autocomplete.tsx`: `Command shouldFilter={false}` wrapping a styled `CommandInput` and, when `open && !disabled`, an absolutely-positioned panel (`CommandItems` + `CommandLoading`/`CommandNoResults`/children) — `disabled` gates the panel at render time, no `useEffect` needed since visibility is a derived boolean, not owned state; its `onKeyDown` closes on Escape and, on Enter while the panel is closed, calls `e.stopPropagation()` so the keypress isn't swallowed by cmdk's `Command` root — which unconditionally calls `preventDefault()` on Enter regardless of whether anything is selectable — letting a surrounding `<form>` still submit on Enter; blur closes after a 150ms delay to let a `CommandOption` click land first; overrides `Command`'s own `bg-popover`/`rounded-xl`/`overflow-hidden` (meant for a floating popup surface) with `bg-transparent`/`rounded-none`/`overflow-visible`, since here that root also wraps the always-visible input — without the override the input inherited the popover background color and had its own `rounded-lg` corners clipped by the root's smaller `rounded-xl` mask
- `useInlineComboboxOpenState` (function) — shared `open`/`onValueChange`/`onFocus`/`onClose` wiring hook: both consumers previously duplicated this exact block (open on focus/typing once `value` is non-empty, close on blur/Escape/select) verbatim; each still derives its own panel-visibility boolean from the returned `open` plus its own extra conditions before passing it to `InlineCombobox`'s `open` prop

### Exports

- `InlineCombobox` — named
- `useInlineComboboxOpenState` — named (function)

---

## input.tsx

### Imports

- `react` — `ComponentProps` for HTML element prop spreading
- `@base-ui/react/input` — `Input` as `InputPrimitive` accessible input primitive
- `@/lib/utils` — `cn` class merging helper

### Definitions

- `inputClassName` (const) — the Tailwind class string used by `Input`, exported so `inline-combobox.tsx` can style a raw cmdk `CommandInput` (which can't use `Input` itself — Base UI's `InputPrimitive` and cmdk's controlled ref/attribute wiring don't compose) to visually match it, without hand-copying the string
- `Input` (component) — styled text input delegating to Base UI `InputPrimitive` with full aria/validation/disabled class support

### Exports

- `Input` — named
- `inputClassName` — named (const)

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

- `react` — `useState` for the controlled test harness
- `@testing-library/react` — `render`, `screen` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./loyalty-program-combobox` — `LoyaltyProgramCombobox` component under test

### Definitions

- `ControlledLoyaltyProgramCombobox` (test helper component) — wraps `LoyaltyProgramCombobox` with local `useState` so multi-keystroke `userEvent.type` behaves like a real controlled consumer
- `LoyaltyProgramCombobox` tests (test suite) — verifies trigger placeholder/value/id/disabled, the search input's `maxLength={100}` cap, suggestion matching/category label/capping at 8, no-results hint, selection closing the popover, `onChange` firing every keystroke, and external value sync via rerender

### Exports

None

---

## loyalty-program-combobox.tsx

### Imports

- `react` — `useMemo` hook
- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@chamuco/shared-types` — `LOYALTY_PROGRAM_SUGGESTIONS`, `LoyaltyProgramCategory` suggestions data and category type
- `@/components/ui/free-text-combobox` — `FreeTextCombobox` shared free-text popover combobox primitive

### Definitions

- `LoyaltyProgramComboboxProps` (interface) — `id`, `value`, `onChange`, `disabled`, `className`, `data-testid`, `aria-invalid` (forwarded to `FreeTextCombobox` so callers can drive an inline `FieldMessage`, see `LoyaltyProgramsSection.tsx`); no `required` (no literal `<input>` backs the field — callers needing that validation must check it in their own submit handler); `maxLength` is restored via `FreeTextCombobox` (forwarded to `ComboboxPopover`'s search input) rather than a native attribute
- `LoyaltyProgramCombobox` (component) — thin wrapper around `FreeTextCombobox`; builds `{value, label, subtitle}` options from `LOYALTY_PROGRAM_SUGGESTIONS` (subtitle = translated category), passes `maxSuggestions={8}` and `maxLength={100}`

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

## multi-select.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `within` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./multi-select` — `MultiSelect` component under test

### Definitions

- `MultiSelect` tests (test suite) — verifies placeholder/chip rendering, option list, toggle-on-select/toggle-off-when-already-selected, selected hint, chip removal (and that it doesn't reopen the popover), `disabled`, and an option's `icon` rendering when provided

### Exports

- None (test file)

---

## multi-select.tsx

### Imports

- `@phosphor-icons/react` — `CaretUpDownIcon`, `XIcon` icons
- `@/lib/utils` — `cn` class merging helper
- `@/components/ui/badge` — `Badge` chip rendering for selected values
- `@/components/ui/button` — `buttonVariants` cva classes applied to the non-native trigger `<div>`
- `@/components/ui/combobox-popover` — `ComboboxPopover` shared Popover+Command wiring
- `@/components/ui/command` — `buildFilterValue`, `CommandOption` filter-string helper and individual option row
- `@/components/ui/select-item` — `SelectItem`, `SelectOption` shared icon/label/selected-state item renderer and option data shape

### Definitions

- `MultiSelectOption` (type) — re-export of `SelectOption` (`{ value, label, icon? }`) from `select-item.tsx`, kept under its original name for existing consumers
- `MultiSelectProps` (interface) — prop types for `MultiSelect`; all display text passed in by the caller, no i18n coupling, including `selectedHint` for the screen-reader-only "selected" announcement
- `MultiSelect` (component) — searchable multi-select combobox built on `ComboboxPopover`; trigger renders as a plain `<div>` styled via `buttonVariants` (not the `Button` component — Base UI's `Button` always renders a literal `<button>` unless also given a `render` override, so using it here would still produce an invalid `<button>`-in-`<button>` for the chip remove controls) so selected-value chips (each with its own remove button, `title`+`aria-label` on the remove icon) can live inside the trigger box without invalid nested `<button>` markup; chip removal stops event propagation so it doesn't toggle the popover; each option renders via `SelectItem` (optional icon + selected checkmark + visually-hidden `, {selectedHint}` span, since cmdk's `CommandItem` unconditionally overwrites `aria-selected` with its own keyboard-highlight state)

### Exports

- `MultiSelect` — named
- `MultiSelectOption` — named (type)

---

## phone-input.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./phone-input` — `PhoneInput`, `cleanPhoneNumber`, `isPhoneValid`, `parsePastedPhoneNumber` under test

### Definitions

- `cleanPhoneNumber` tests (test suite) — verifies whitespace stripping (leading, trailing, internal, tabs)
- `isPhoneValid` tests (test suite) — verifies delegation to `libphonenumber-js` and pre-stripping of spaces
- `PhoneInput` tests (test suite) — verifies rendering, field integration, error states, paste-split behavior, and disabled (number input and, now, the country combobox)
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
- `PhoneInput` (component) — country code combobox + local number field with paste-detection, sr-only label, and error display; forwards its own `disabled` prop to both the number `Input` and the `CountryCombobox` (previously only reached the number field)

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

## select-item.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` render/query helpers
- `vitest` — `describe`, `it`, `expect`
- `./select-item` — `SelectItem`, `ComboboxTriggerContent` components under test

### Definitions

- `SelectItem` tests (test suite) — verifies children rendering, icon rendering (`aria-hidden`) when passed and omission when not, checkmark rendering only when `selected`, and `selectedHint` sr-only text rendering only when both `selected` and provided
- `ComboboxTriggerContent` tests (test suite) — verifies children render when `selected`, placeholder renders when not, and the caret icon is always present with `aria-hidden`

### Exports

- None (test file)

---

## select-item.tsx

### Imports

- `react` — `ReactNode` type
- `@phosphor-icons/react` — `CaretUpDownIcon`, `CheckIcon` icons

### Definitions

- `SelectOption` (interface) — `{ value, label, icon? }` plain option data shape shared by `Select` and `MultiSelectOption`
- `SelectItem` (component) — shared item-row primitive rendered as the children of a `CommandOption`: optional `aria-hidden` icon slot, caller-controlled label markup (`children`), and an optional checkmark + visually-hidden `, {selectedHint}` span when `selected`; used by `select.tsx`, `country-combobox.tsx`, `multi-select.tsx`, `city-combobox.tsx`, and `loyalty-program-combobox.tsx` to avoid duplicating this icon/label/selected-state JSX
- `ComboboxTriggerContent` (component) — shared trigger body for single-value combobox pickers: renders `children` (selected content) in a truncating flex row when `selected`, else a muted `placeholder` span, followed by a `CaretUpDownIcon` (`aria-hidden`); used by `select.tsx` and `country-combobox.tsx` to avoid duplicating this icon/label/placeholder/caret JSX

### Exports

- `SelectItem` — named
- `SelectOption` — named (interface)
- `ComboboxTriggerContent` — named

---

## select.test.tsx

### Imports

- `react` — `ComponentProps`, `ReactNode` for mock component types
- `@testing-library/react` — `render`, `screen`, `within` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `vitest` — `describe`, `it`, `expect`, `vi`
- `./select` — `Select` component under test

### Definitions

- `Select` tests (test suite) — mocks `@/components/ui/button`, `@/components/ui/popover`, and `@/components/ui/command` (same role-mapped stand-ins used elsewhere; the `CommandSearch` mock reflects `visuallyHidden` as a `data-visually-hidden` attribute since it's now always rendered; `buildFilterValue` mocked as a plain `join(' ')`); verifies placeholder vs selected-label rendering in the trigger, `onChange` firing with an option's value or `''` for the placeholder row, no placeholder row when `placeholder` is omitted or when `clearable={false}`, `disabled`/`data-testid` forwarding, option `icon` rendering, and `searchable` toggling the search box's visibility marker

### Exports

- None (test file)

---

## select.tsx

### Imports

- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@/lib/utils` — `cn` class merging helper
- `@/components/ui/button` — `Button` trigger button
- `@/components/ui/combobox-popover` — `ComboboxPopover` shared Popover+Command wiring
- `@/components/ui/command` — `buildFilterValue`, `CommandOption` filter-string helper and individual option row
- `@/components/ui/select-item` — `ComboboxTriggerContent`, `SelectItem`, `SelectOption` shared trigger body, item renderer, and option data shape

### Definitions

- `SelectProps` (interface) — `value`/`onChange` (plain strings), `options: SelectOption[]`, optional `placeholder` (adds a clearable "nothing selected" row calling `onChange('')`), `clearable` (default `true` — set `false` for a field whose placeholder is display-only, not a real "no selection" state, e.g. `TimezoneCombobox` in `BasicInfoSection.tsx`), `searchable` (default `false` — every current usage is a small enum), `autoFocus`, `searchPlaceholder`/`noResultsText`/`selectedHint` (default to `common:select.*`/`common:a11y.selected` i18n keys), `disabled`, `className`, `contentClassName`, `id`, aria props, `data-testid`
- `Select` (component) — popover-based single-select replacing the former native `<select>` wrapper; built on `ComboboxPopover` + `CommandOption` + `SelectItem`; trigger body shares `ComboboxTriggerContent` with `country-combobox.tsx`; trigger is a full-width `Button variant="outline"` (same design language as `CountryCombobox`/`TimezoneCombobox`); popup width matches the trigger via `w-[var(--anchor-width)]`

### Exports

- `Select` — named
- `SelectProps` — named (type)

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

## timezone-combobox.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `within` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./timezone-combobox` — `TimezoneCombobox` component under test

### Definitions

- `TimezoneCombobox` tests (test suite) — verifies placeholder rendering, formatted-label display for a selected timezone, `onChange` on option selection, `clearable={false}` omitting the clear row from the option list, the clear row rendering by default when a `placeholder` is set, and `disabled` forwarding

### Exports

- None (test file)

---

## timezone-combobox.tsx

### Imports

- `react` — `useMemo` hook
- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@/components/ui/select` — `Select` shared popover-based single-select primitive
- `@/lib/timezones` — `TIMEZONES`, `formatTimezoneLabel` timezone list and label formatter

### Definitions

- `TimezoneComboboxProps` (interface) — `value`, `onChange`, `placeholder`, `clearable` (default `true`, forwarded to `Select` — `BasicInfoSection.tsx` passes `false` since its timezone field always has a value and shouldn't be resettable to empty), `className`, `disabled`, aria attributes; no more `searchPlaceholder`/`noResultsText`/`selectedHint` overrides — resolved internally from `common:timezoneCombobox.*`/`common:a11y.selected` i18n keys, matching `CountryCombobox`'s precedent
- `TimezoneCombobox` (component) — thin wrapper around `Select`: maps `TIMEZONES` into `{value, label}` options via `formatTimezoneLabel`; `searchable` (the list has ~400 entries) with `autoFocus={false}` to preserve its original non-autofocusing search behavior

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

## trip-task-item.test.tsx

### Imports

- `vitest` — `describe`, `it`, `expect`, `vi`, `afterEach`
- `@testing-library/react` — `render`, `screen`, `fireEvent`, `waitFor`
- `@chamuco/shared-types` — `TripTaskScope`
- `./trip-task-item` — `TripTaskItem` (subject under test)
- `@/services/trips.types` — `TripTask` (type-only)

### Definitions

- Mocks `@/components/ui/edit-delete-actions` with a stub exposing `edit-btn`/`delete-btn` test IDs
- `task` (const) — baseline `TripTask` fixture (PERSONAL, not completed, `completedByUsername: null`)
- Test suite covering title rendering, strike-through styling, the inline `@username` suffix appended to the title (shown only when both `completed` and `completedByUsername` are set), checkbox toggle, delete gating, and a `describe('rename', ...)` block covering edit-action visibility, entering edit mode with the current title pre-filled, saving a trimmed title via `onRename`, cancelling without calling `onRename`, and saving an unchanged title as a no-op

### Exports

- none (test file)

---

## trip-task-item.tsx

### Imports

- `react` — `useState`
- `react-i18next` — `useTranslation`
- `@/components/ui/checkbox` — `Checkbox`
- `@/components/ui/edit-delete-actions` — `EditDeleteActions`
- `@/components/ui/input` — `Input`
- `@/lib/utils` — `cn` class merging helper
- `@/services/trips.types` — `TripTask` (type-only)

### Definitions

- `TripTaskItem` (component) — renders a checkbox bound to `task.completed`, the task title (strike-through when completed) with an inline ` @username` suffix appended when the task is completed and `task.completedByUsername` is set (ORGANIZER tasks only — accountability for who completed it), and edit/delete actions when `onRename`/`onDelete` are provided (omit either to hide that affordance, e.g. a SHARED task for a non-organizer). When editing, swaps the row for an `Input` pre-filled with the title plus Cancel/Save buttons; Save is a no-op (no API call) when the trimmed title is empty or unchanged. Tracks local `isToggling`/`isDeleting`/`isEditing`/`isSaving` state to disable interaction mid-mutation

### Exports

- `TripTaskItem` — named

---

## user-autocomplete.test.tsx

### Imports

- `react` — `ComponentProps`, `ReactNode` for mock component types
- `@testing-library/react` — `render`, `screen`, `waitFor` render/query helpers
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `./user-autocomplete` — `UserAutocomplete` component under test
- `@/types/user` — `UserSearchResult` type

### Definitions

- `UserAutocomplete` tests (test suite) — real (unmocked) `InlineCombobox`/`cmdk`; verifies dropdown visibility (`role="combobox"`/`"listbox"`, not the old plain `"textbox"`/`"list"`), spinner, empty state, result items with display name and username, `onSelect`/`onChange` callbacks, keyboard navigation (ArrowDown, Enter, Escape), `@`-only query suppression, `disabled` disabling the input, and `disabled` flipping to `true` while open closing the dropdown

### Exports

- None (test file)

---

## user-autocomplete.tsx

### Imports

- `react-i18next` — `useTranslation` for i18n `t()` accessor
- `@/components/ui/avatar` — `Avatar` user avatar
- `@/components/ui/command` — `CommandOption` individual option row
- `@/components/ui/inline-combobox` — `InlineCombobox`, `useInlineComboboxOpenState` shared always-visible-input combobox shell and open-state hook
- `@/hooks/useUserSearch` — `useUserSearch` hook for debounced user search
- `@/types/user` — `UserSearchResult` local type

### Definitions

- `UserAutocompleteProps` (interface) — `value`, `onChange`, `onSelect`, `placeholder`, `disabled` (new — previously not accepted at all, so callers with an `isSending`/saving state couldn't disable the field mid-request), `className`, `aria-invalid`, `data-testid`
- `UserAutocomplete` (component) — rebuilt on `InlineCombobox`; no more manual `activeIndex`/`handleKeyDown` — cmdk's `Command` root handles arrow-key/Enter navigation and each `CommandOption`'s `onSelect` handles selection; keeps its own `value !== '@'` panel-visibility nuance (avoids flashing "no results" for that one fleeting keystroke) since that's genuinely `UserAutocomplete`-specific, passed to `InlineCombobox` as a derived `open` boolean

### Exports

- `UserAutocomplete` — named
- `UserAutocompleteProps` — named (type)

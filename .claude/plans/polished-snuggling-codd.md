# Plan: Client-side image crop before avatar upload (Issue #253)

## Context

Right now, the photo tab in `AvatarEditor` uses `FileUploadButton` which immediately uploads the raw file to GCS the moment the user picks it. This produces oversized, inconsistently-sized originals. The goal is to intercept the file, show a crop/zoom editor so the user can frame their face, export a normalized 512×512 JPEG blob, and only then upload. A new requirement adds that the current avatar should be visible inside the crop view for comparison.

---

## Files to modify / create

| File                                                    | Action                             |
| ------------------------------------------------------- | ---------------------------------- |
| `apps/web/package.json`                                 | Add `react-image-crop` runtime dep |
| `apps/web/src/components/profile/AvatarCropModal.tsx`   | Create — crop step UI              |
| `apps/web/src/components/profile/AvatarEditor.tsx`      | Modify — wire crop flow            |
| `apps/web/src/components/profile/AvatarEditor.test.tsx` | Modify — update mocks/tests        |
| `apps/web/src/locales/en.json`                          | Add `cropEditor.*` keys            |
| `apps/web/src/locales/es.json`                          | Add `cropEditor.*` keys (ES)       |

---

## Approach

### Step 1 — Install `react-image-crop`

```bash
pnpm --filter web add react-image-crop
```

This is a runtime dep only in `apps/web` — not a shared devDep, so it does NOT go in the pnpm catalog.

---

### Step 2 — New state in `AvatarEditor`

Replace the `FileUploadButton` with a manual file input + `useFileUpload` hook directly.

New state:

```ts
const [cropFile, setCropFile] = useState<File | null>(null);
```

When `cropFile !== null` → render `AvatarCropModal` (passed as children inside the existing `DialogPopup`). When `cropFile === null` → render the normal tabs.

**This is a single-dialog content swap** — no nested dialogs. The same `Dialog` the editor already uses switches its content between the tabs view and the crop view when a file is selected. This avoids nested-dialog a11y issues.

Flow:

```
File input onChange
  → setCropFile(file)           // show crop step inside the open dialog
  → AvatarCropModal renders

User clicks "Use photo"
  → canvas.toBlob(cb, 'image/jpeg', 0.9)   // 512×512
  → new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
  → upload(file)                            // useFileUpload
  → handlePhotoSuccess(objectKey, blob.size)
  → setCropFile(null)

User clicks "Cancel"
  → setCropFile(null)           // back to tabs view
```

---

### Step 3 — `AvatarCropModal` component

`apps/web/src/components/profile/AvatarCropModal.tsx`

Props:

```ts
interface AvatarCropModalProps {
  file: File;
  currentAvatarUrl: string | undefined;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}
```

Layout (inside the existing `DialogPopup` content area):

```
┌─────────────────────────────────────────────────┐
│  [title: "Crop photo"]                           │
│                                                  │
│  Current:   ┌──────────────────────────────┐    │
│  [Avatar]   │   ReactCrop (aspect 1, circ.) │    │
│  64×64 px   │   drag + scroll to zoom       │    │
│             └──────────────────────────────┘    │
│                                                  │
│            [Cancel]   [Use photo]                │
└─────────────────────────────────────────────────┘
```

- `ReactCrop` from `react-image-crop` with `aspect={1}`, `circularCrop={false}` (square)
- Zoom via an HTML `<input type="range">` (simpler cross-platform than pinch, which requires a gesture lib)
- "Use photo" calls `drawToCanvas(512, 512).toBlob(...)` and passes blob to `onConfirm`
- Current avatar shown as a small `<Avatar>` with label `t('basicInfo.avatarEditor.cropEditor.currentAvatar')`; hidden when `currentAvatarUrl` is undefined

---

### Step 4 — `AvatarEditor.tsx` changes

- Remove `FileUploadButton` import
- Add `useFileUpload` directly, plus `useRef<HTMLInputElement>`
- Add `cropFile` state
- Render a plain button that triggers `inputRef.current.click()`
- `onChange` → `setCropFile(file)`; reset input value so re-selection works
- When `cropFile !== null`, replace tab content area with `<AvatarCropModal>`
- `onConfirm(blob)` handler: `upload(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))` → `handlePhotoSuccess(objectKey, blob.size)` → `setCropFile(null)`
- `onCancel` handler: `setCropFile(null)`

---

### Step 5 — i18n keys

Add under `profile.basicInfo.avatarEditor.cropEditor` in both `en.json` and `es.json`:

| Key             | EN                 | ES                |
| --------------- | ------------------ | ----------------- |
| `title`         | `"Crop photo"`     | `"Recortar foto"` |
| `usePhoto`      | `"Use photo"`      | `"Usar foto"`     |
| `cancel`        | `"Cancel"`         | `"Cancelar"`      |
| `currentAvatar` | `"Current avatar"` | `"Avatar actual"` |
| `zoomLabel`     | `"Zoom"`           | `"Zoom"`          |

---

### Step 6 — Tests

**`AvatarEditor.test.tsx`** changes:

- Remove `FileUploadButton` mock
- Add mock for `AvatarCropModal` that exposes `data-testid="crop-modal"` and calls `onConfirm(new Blob())` when a "confirm" button is clicked
- Add mock for `useFileUpload` returning `{ upload: mockUpload, ... }`
- Update photo upload tests to reflect two-step flow: file selection → crop modal → confirm → PATCH

**`AvatarCropModal.test.tsx`** (new):

- Renders with a test file and calls `onConfirm` with a Blob on confirm click
- Calls `onCancel` on cancel click
- Shows current avatar section when `currentAvatarUrl` is provided
- Hides current avatar section when `currentAvatarUrl` is undefined
- Canvas mock: `HTMLCanvasElement.prototype.toBlob = (cb) => cb(new Blob(...))`

---

## Verification

```bash
# Install
pnpm --filter web add react-image-crop

# Type check
pnpm --filter web typecheck 2>&1 | tail -n 20

# Tests
pnpm --filter web test 2>&1 | tail -n 80

# i18n validation
./scripts/validate-i18n-keys.sh

# Start dev server and manually test:
#   1. Profile page → Change avatar → Upload photo tab
#   2. Select an image → crop modal opens, current avatar visible
#   3. Drag to reposition, use zoom slider
#   4. "Use photo" → uploads → avatar updates
#   5. "Cancel" → returns to tabs, no upload
#   6. Emoji tab still works unchanged
pnpm --filter web dev
```

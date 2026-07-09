# Inventory: data

---

## asset.ts

### Imports

- (none)

### Definitions

- AssetType (type) — union of allowed asset kinds: `'image' | 'video' | 'file' | 'link' | 'text'`
- AssetSource (type) — union of allowed asset origin sources: `'gcs' | 'url' | 'emoji' | 'text'`
- Asset (interface) — core asset record shape with id, type, source, target, fileSize, isPublic, and createdAt
- ResolvedAsset (interface) — extends Asset with a resolved public `url` and optional `expiresAt` timestamp

### Exports

- AssetType — named
- AssetSource — named
- Asset — named
- ResolvedAsset — named

---

## index.ts

### Imports

- (none — barrel only)

### Definitions

- (none)

### Exports

- `./asset` — barrel re-export
- `./loyalty-programs.data` — barrel re-export

---

## loyalty-programs.data.ts

### Imports

- (none)

### Definitions

- LoyaltyProgramCategory (type) — union of loyalty program category strings: `'airline' | 'hotel' | 'car_rental' | 'cruise' | 'bank' | 'other'`
- LoyaltyProgramSuggestion (interface) — shape for a single loyalty program entry with `name` and `category`
- LOYALTY_PROGRAM_SUGGESTIONS (const) — readonly array of 46 pre-defined LoyaltyProgramSuggestion entries covering airlines, hotels, car rentals, cruises, and banks

### Exports

- LoyaltyProgramCategory — named
- LoyaltyProgramSuggestion — named
- LOYALTY_PROGRAM_SUGGESTIONS — named

# Chamuco Web App

Next.js frontend application for Chamuco Travel platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Theme**: next-themes (dark/light/system)
- **i18n**: i18next + react-i18next
- **Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Installation

From the repository root:

```bash
pnpm install
```

### Development

```bash
# From repository root
pnpm --filter web dev

# Or from this directory
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Reusable React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configurations
│   ├── services/        # API service layer
│   ├── store/           # State management
│   ├── types/           # TypeScript type definitions
│   └── locales/         # i18n translation files
├── public/              # Static assets
└── test/
    ├── unit/            # Unit tests
    └── e2e/             # End-to-end tests

```

## Available Scripts

### Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Code Quality

- `pnpm lint` - Run ESLint with auto-fix
- `pnpm lint:check` - Run ESLint without auto-fix
- `pnpm typecheck` - Run TypeScript type checking

### Testing

- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run unit tests in watch mode
- `pnpm test:cov` - Run unit tests with coverage report
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm test:e2e:ui` - Run e2e tests with Playwright UI

### Utilities

- `pnpm clean` - Remove build artifacts and caches

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
import { Button } from '@/components/Button';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types';
```

## Coverage Thresholds

Unit tests must maintain 90% coverage across:

- Lines
- Functions
- Branches
- Statements

Coverage is enforced by Vitest and checked in the pre-commit hook.

## Internationalization

All user-facing strings must use i18next translation keys. Direct string literals in components are blocked by ESLint:

```typescript
// ❌ Wrong
<button>Click me</button>

// ✅ Correct
<button>{t('common:submit')}</button>
```

Supported locales:

- `en` - English
- `es` - Spanish (Español)

## Testing

### Unit Tests

Unit tests use Vitest and React Testing Library. Test files are co-located with their components:

```
src/components/
├── Button.tsx
└── Button.test.tsx
```

### E2E Tests

End-to-end tests use Playwright and run against multiple browsers:

- Chromium
- Firefox
- WebKit
- Mobile Chrome
- Mobile Safari

## Theme Support

The app supports light, dark, and system themes using `next-themes`. Theme preference is persisted in cookies for SSR compatibility.

## License

UNLICENSED - Proprietary

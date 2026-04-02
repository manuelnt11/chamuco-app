# Build Scripts

This directory contains build-time automation scripts for the Chamuco Web application.

---

## `generate-pwa-icons.mjs`

**Purpose:** Automatically generates PWA icons and favicon files from source SVG assets.

**Runs:** Automatically before every production build via `pnpm build` script.

**Input:** SVG files from `documentation/assets/`:

- `logo_icon.svg` — Standard Chamuco logo
- `logo_maskable.svg` — Safe-zone variant for Android adaptive icons

**Output:** PNG and ICO files in `public/`:

| File                              | Size      | Purpose                                     |
| --------------------------------- | --------- | ------------------------------------------- |
| `icons/icon-192x192.png`          | 192×192   | PWA icon (standard size)                    |
| `icons/icon-512x512.png`          | 512×512   | PWA icon (high-res)                         |
| `icons/icon-512x512-maskable.png` | 512×512   | PWA icon (Android adaptive with safe zone)  |
| `favicon-16x16.png`               | 16×16     | Browser tab favicon (PNG)                   |
| `favicon-32x32.png`               | 32×32     | Browser tab favicon (PNG)                   |
| `favicon.ico`                     | Multi-res | Multi-resolution .ico (16×16, 32×32, 48×48) |
| `apple-touch-icon.png`            | 180×180   | iOS home screen icon                        |

**Dependencies:**

- `sharp` — SVG → PNG rasterization
- `png-to-ico` — PNG → ICO conversion (modern, zero deprecated dependencies)

**Manual execution:**

```bash
pnpm icons:generate
```

**Why automated generation?**

- Reproducible across environments (dev, CI, Docker)
- Single source of truth (SVG assets in `documentation/assets/`)
- Prevents manual export errors
- Works in CI pipelines without GUI tools

---

## Adding New Scripts

When adding new build scripts:

1. Use `.mjs` extension for ESM support
2. Add corresponding npm script to `package.json`
3. Document inputs, outputs, and purpose in this README
4. Integrate into build pipeline if required at build time
5. Ensure scripts are platform-agnostic (Node.js APIs only, no shell commands)

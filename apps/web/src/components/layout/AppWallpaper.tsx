'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AirplaneTiltIcon,
  BackpackIcon,
  BinocularsIcon,
  CameraIcon,
  CompassIcon,
  GlobeHemisphereWestIcon,
  IslandIcon,
  MapPinIcon,
  MapTrifoldIcon,
  MountainsIcon,
  SuitcaseRollingIcon,
  TentIcon,
  UmbrellaIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';

const WALLPAPER_ICONS = [
  AirplaneTiltIcon,
  MapPinIcon,
  CompassIcon,
  UsersThreeIcon,
  SuitcaseRollingIcon,
  GlobeHemisphereWestIcon,
  TentIcon,
  BackpackIcon,
  CameraIcon,
  IslandIcon,
  BinocularsIcon,
  MountainsIcon,
  MapTrifoldIcon,
  UmbrellaIcon,
];

const ROTATIONS = [
  'rotate-0',
  'rotate-12',
  '-rotate-12',
  'rotate-6',
  '-rotate-6',
  'rotate-[20deg]',
  '-rotate-[20deg]',
  'rotate-[32deg]',
  '-rotate-[32deg]',
];

const SIZES = ['size-6', 'size-7', 'size-8', 'size-9'];

const JITTERS = [
  '',
  'translate-x-2',
  '-translate-x-2',
  'translate-y-2',
  '-translate-y-2',
  'translate-x-1 translate-y-1',
  '-translate-x-1 -translate-y-1',
  'translate-x-1 -translate-y-1',
  '-translate-x-1 translate-y-1',
];

const STRENGTH = [
  'text-muted-foreground/15',
  'text-muted-foreground/20',
  'text-muted-foreground/25',
];

// Deterministic integer hash (SSR-safe — no Math.random/Date.now) so each tile picks its
// icon/rotation/size/jitter/strength independently instead of cycling in a visible sequence.
function hash(seed: number): number {
  let x = (seed ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x, 2654435761) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519) >>> 0;
  x ^= x >>> 13;
  return x >>> 0;
}

// Must match the grid-cols minmax(...) and auto-rows-* below.
const TILE_SIZE = 72;

// Tailwind's `md` breakpoint — below this the pattern never mounts, so mobile pays no
// DOM/hydration cost for a layer it can never see (the shell has no side gutters there).
const DESKTOP_BREAKPOINT = 768;

// Extra rows so a tile count computed just before a resize/DPR change still overflows the
// viewport slightly rather than under-filling it; overflow-hidden clips the excess.
const BUFFER_ROWS = 2;

// Number of tiles needed to fully cover the current viewport at TILE_SIZE, or 0 below the
// desktop breakpoint. Recomputed on resize so it never over- or under-covers the gutters.
function useWallpaperTileCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function recompute() {
      if (window.innerWidth < DESKTOP_BREAKPOINT) {
        setCount(0);
        return;
      }
      const cols = Math.ceil(window.innerWidth / TILE_SIZE);
      const rows = Math.ceil(window.innerHeight / TILE_SIZE) + BUFFER_ROWS;
      setCount(cols * rows);
    }

    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, []);

  return count;
}

// Non-null assertions are safe: `hash(...) % array.length` is always a valid index into that array.
function buildWallpaperTiles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    Icon: WALLPAPER_ICONS[hash(i) % WALLPAPER_ICONS.length]!,
    rotation: ROTATIONS[hash(i + 1000) % ROTATIONS.length]!,
    size: SIZES[hash(i + 2000) % SIZES.length]!,
    jitter: JITTERS[hash(i + 4000) % JITTERS.length]!,
    strength: STRENGTH[hash(i + 8000) % STRENGTH.length]!,
  }));
}

// Fills the empty gutters beside the centered app shell on wide desktop screens with a
// WhatsApp-style repeating icon pattern, masking the shell's own column back to a solid
// background so the pattern never shows through gaps in the header/nav/main content.
export function AppWallpaper() {
  const tileCount = useWallpaperTileCount();
  const wallpaperTiles = useMemo(() => buildWallpaperTiles(tileCount), [tileCount]);

  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 -z-20 hidden overflow-hidden md:block">
        <div className="grid h-full w-full grid-cols-[repeat(auto-fill,minmax(72px,1fr))] auto-rows-18">
          {wallpaperTiles.map(({ Icon, rotation, size, jitter, strength }, i) => (
            <div key={i} className="flex items-center justify-center">
              <Icon className={`${size} ${strength} ${rotation} ${jitter}`} />
            </div>
          ))}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="fixed inset-y-0 left-app-edge right-app-edge -z-10 hidden bg-background md:block"
      />
    </>
  );
}

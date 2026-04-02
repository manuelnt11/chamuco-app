import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Chamuco Travel',
    short_name: 'Chamuco',
    description: 'Group travel coordination made easy',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F4C75', // Horizonte Oceano (dark anchor)
    theme_color: '#38BDF8', // Horizonte Cielo (primary brand)
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

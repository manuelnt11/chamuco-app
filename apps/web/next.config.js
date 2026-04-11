/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Allow Firebase signInWithPopup to communicate back via window.opener
        source: '/(sign-in|onboarding)',
        headers: [{ key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' }],
      },
    ];
  },
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['react-i18next'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;

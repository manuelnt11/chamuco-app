import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        horizonte: {
          cielo: {
            DEFAULT: '#38BDF8',
            light: '#7DD3FC',
            dark: '#0284C7',
          },
          naranja: {
            DEFAULT: '#FB923C',
            light: '#FDBA74',
            dark: '#F97316',
          },
          nube: {
            DEFAULT: '#F0F9FF',
            light: '#FFFFFF',
            dark: '#E0F2FE',
          },
          oceano: {
            DEFAULT: '#0F4C75',
            light: '#1E6BA1',
            dark: '#0A3A5A',
          },
          brisa: {
            DEFAULT: '#BAE6FD',
            light: '#E0F2FE',
            dark: '#7DD3FC',
          },
        },
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem',
        '5xl': '8rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;

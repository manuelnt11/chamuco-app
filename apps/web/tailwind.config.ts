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
        // shadcn semantic tokens (CSS variables)
        background: 'oklch(var(--background))',
        foreground: 'oklch(var(--foreground))',
        card: {
          DEFAULT: 'oklch(var(--card))',
          foreground: 'oklch(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover))',
          foreground: 'oklch(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'oklch(var(--primary))',
          foreground: 'oklch(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary))',
          foreground: 'oklch(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted))',
          foreground: 'oklch(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent))',
          foreground: 'oklch(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive))',
        },
        border: 'oklch(var(--border))',
        input: 'oklch(var(--input))',
        ring: 'oklch(var(--ring))',
        chart: {
          '1': 'oklch(var(--chart-1))',
          '2': 'oklch(var(--chart-2))',
          '3': 'oklch(var(--chart-3))',
          '4': 'oklch(var(--chart-4))',
          '5': 'oklch(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'oklch(var(--sidebar))',
          foreground: 'oklch(var(--sidebar-foreground))',
          primary: 'oklch(var(--sidebar-primary))',
          'primary-foreground': 'oklch(var(--sidebar-primary-foreground))',
          accent: 'oklch(var(--sidebar-accent))',
          'accent-foreground': 'oklch(var(--sidebar-accent-foreground))',
          border: 'oklch(var(--sidebar-border))',
          ring: 'oklch(var(--sidebar-ring))',
        },

        // Horizonte palette (direct usage with CSS variables)
        horizonte: {
          cielo: {
            DEFAULT: 'oklch(var(--horizonte-cielo))',
            light: 'oklch(var(--horizonte-cielo-light))',
            dark: 'oklch(var(--horizonte-cielo-dark))',
          },
          naranja: {
            DEFAULT: 'oklch(var(--horizonte-naranja))',
            light: 'oklch(var(--horizonte-naranja-light))',
            dark: 'oklch(var(--horizonte-naranja-dark))',
          },
          nube: {
            DEFAULT: 'oklch(var(--horizonte-nube))',
            light: 'oklch(var(--horizonte-nube-light))',
            dark: 'oklch(var(--horizonte-nube-dark))',
          },
          oceano: {
            DEFAULT: 'oklch(var(--horizonte-oceano))',
            light: 'oklch(var(--horizonte-oceano-light))',
            dark: 'oklch(var(--horizonte-oceano-dark))',
          },
          brisa: {
            DEFAULT: 'oklch(var(--horizonte-brisa))',
            light: 'oklch(var(--horizonte-brisa-light))',
            dark: 'oklch(var(--horizonte-brisa-dark))',
          },
        },
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: 'var(--radius)',
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

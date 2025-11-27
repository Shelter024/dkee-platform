import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* System tokens mapped to CSS variables for consistent theming */
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        surfaceAlt: 'var(--color-surface-alt)',
        border: 'var(--color-border)',
        textPrimary: 'var(--color-text)',
        textMuted: 'var(--color-text-muted)',
        primaryBase: 'var(--color-primary)',
        accentBase: 'var(--color-accent)',
        dangerBase: 'var(--color-danger)',
        successBase: 'var(--color-success)',
        warningBase: 'var(--color-warning)',
        // Brand Red (from logo) - Use for CTAs, alerts, highlights
        brand: {
          red: {
            50: '#ffebee',
            100: '#ffcdd2',
            200: '#ef9a9a',
            300: '#e57373',
            400: '#ef5350',
            500: '#d32f2f', // Primary brand red from logo
            600: '#c62828',
            700: '#b71c1c',
            800: '#a41818',
            900: '#8b1414',
          },
          // Brand Navy Blue (from logo) - Use for headers, primary buttons
          navy: {
            50: '#e8eaf6',
            100: '#c5cae9',
            200: '#9fa8da',
            300: '#7986cb',
            400: '#5c6bc0',
            500: '#3f51b5',
            600: '#3949ab',
            700: '#303f9f',
            800: '#283593',
            900: '#1a237e', // Primary brand navy from logo
          },
        },
        // Primary palette (Navy-based for professionalism & trust)
        primary: {
          50: '#e8eaf6',
          100: '#c5cae9',
          200: '#9fa8da',
          300: '#7986cb',
          400: '#5c6bc0',
          500: '#3949ab',
          600: '#303f9f',
          700: '#283593',
          800: '#1a237e', // Brand navy
          900: '#0d1642',
        },
        // Secondary palette (Warm orange for CTAs & engagement)
        secondary: {
          50: '#fff3e0',
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#ff9800',
          600: '#fb8c00',
          700: '#f57c00',
          800: '#ef6c00',
          900: '#e65100',
        },
        // Accent palette (Red for urgency, status indicators)
        accent: {
          50: '#ffebee',
          100: '#ffcdd2',
          200: '#ef9a9a',
          300: '#e57373',
          400: '#ef5350',
          500: '#d32f2f', // Brand red
          600: '#c62828',
          700: '#b71c1c',
          800: '#a41818',
          900: '#8b1414',
        },
        // Success (Ghana-inspired green)
        success: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        // Neutral grays for legibility
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
      borderRadius: {
        'lg': 'var(--radius-base)',
        'xl': 'calc(var(--radius-base) + 0.25rem)',
        '2xl': 'calc(var(--radius-base) + 0.5rem)'
      },
    },
  },
  plugins: [],
};

export default config;

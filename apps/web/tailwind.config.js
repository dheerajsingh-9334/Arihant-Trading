/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        foreground: 'var(--color-ink)',
        card: {
          DEFAULT: 'var(--color-surface)',
          foreground: 'var(--color-ink)',
        },
        popover: {
          DEFAULT: 'var(--color-surface)',
          foreground: 'var(--color-ink)',
        },
        primary: {
          DEFAULT: '#0F5E63',
          hover: '#0B4A4E',
          soft: '#E3EFEE',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#E3EFEE',
          hover: '#D3E7E6',
          foreground: '#0F5E63',
        },
        accent: {
          DEFAULT: '#9A3412',
          strong: '#7C2D12',
          soft: '#FBEBDD',
          bright: '#F2B872',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#4A5568',
          foreground: '#4A5568',
          faint: '#8A8578',
          soft: '#ECE9E2',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#FBFAF7',
        },
        ink: {
          DEFAULT: '#14213D',
          2: '#3D4A5C',
        },
        line: {
          DEFAULT: '#DCD8CE',
          soft: '#ECE9E2',
          input: '#C9C4B8',
        },
        nav: {
          bg: '#14213D',
          'bg-2': '#1F2E52',
          line: '#3A4A70',
          ink: '#E8EAF0',
          muted: '#B8BFCC',
        },
        destructive: {
          DEFAULT: '#881337',
          soft: '#FCE8EC',
          foreground: '#FFFFFF',
        },
        border: '#DCD8CE',
        input: '#C9C4B8',
        ring: '#0F5E63',
        coach: {
          blue: '#0F5E63',
          blueHover: '#0B4A4E',
          azure: '#0F5E63',
          ice: '#E3EFEE',
          iceHover: '#D3E7E6',
          muted: '#FBFAF7',
          mutedForeground: '#4A5568',
          bg: '#F6F5F1',
          border: '#DCD8CE',
          card: '#FFFFFF',
          text: '#14213D',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '10px',
        lg: '14px',
        xl: '14px',
        '2xl': '16px',
        pill: '999px',
      },
      fontFamily: {
        sans: ['var(--font-body)', "'IBM Plex Sans'", 'system-ui', '-apple-system', 'sans-serif'],
        body: ['var(--font-body)', "'IBM Plex Sans'", 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--font-display)', "'Source Serif 4'", 'Georgia', 'serif'],
        display: ['var(--font-display)', "'Source Serif 4'", 'Georgia', 'serif'],
        mono: ['var(--font-mono)', "'IBM Plex Mono'", 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

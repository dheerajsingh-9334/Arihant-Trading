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
        background: '#F7F8FA',
        foreground: '#152235',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#152235',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#152235',
        },
        primary: {
          DEFAULT: '#0F5E4E',
          hover: '#0B4A3E',
          soft: '#E9F6F2',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#E9F6F2',
          hover: '#D5EDE6',
          foreground: '#0F5E4E',
        },
        accent: {
          DEFAULT: '#16917A',
          strong: '#0F5E4E',
          soft: '#E9F6F2',
          bright: '#16917A',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#5E6A7C',
          foreground: '#5E6A7C',
          faint: '#84928C',
          soft: '#F9FAFB',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F9FAFB',
          alt: '#F9FAFB',
        },
        ink: {
          DEFAULT: '#152235',
          2: '#35463F',
        },
        line: {
          DEFAULT: '#E3E7ED',
          soft: '#E3E7ED',
          input: '#E3E7ED',
        },
        nav: {
          bg: '#F7F8FA',
          'bg-2': '#F1F7F5',
          line: '#E3E7ED',
          ink: '#35463F',
          muted: '#84928C',
          strong: '#132822',
        },
        destructive: {
          DEFAULT: '#B42318',
          soft: '#FEF1EF',
          border: '#F6CFC9',
          foreground: '#FFFFFF',
        },
        border: '#E3E7ED',
        input: '#E3E7ED',
        ring: '#16917A',
        coach: {
          blue: '#0F5E4E',
          blueHover: '#0B4A3E',
          azure: '#0F5E4E',
          ice: '#E9F6F2',
          iceHover: '#D5EDE6',
          muted: '#F9FAFB',
          mutedForeground: '#5E6A7C',
          bg: '#F7F8FA',
          border: '#E3E7ED',
          card: '#FFFFFF',
          text: '#152235',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '10px',
        lg: '10px',
        xl: '10px',
        '2xl': '12px',
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

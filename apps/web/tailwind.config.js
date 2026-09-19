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
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: '#223fa7',
          hover: '#1b326f',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#eaf2ff',
          foreground: '#223fa7',
        },
        muted: {
          DEFAULT: '#eef5ff',
          foreground: '#5871a5',
        },
        accent: {
          DEFAULT: '#3770e3',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        border: '#d6e3f5',
        input: '#d6e3f5',
        ring: '#3770e3',
        coach: {
          blue: '#223fa7',
          blueHover: '#1b326f',
          azure: '#3770e3',
          ice: '#eaf2ff',
          iceHover: '#dce8fc',
          muted: '#eef5ff',
          mutedForeground: '#5871a5',
          bg: '#f7fbff',
          border: '#d6e3f5',
          card: '#ffffff',
          text: '#1a1a1a',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

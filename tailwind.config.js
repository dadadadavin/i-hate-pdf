/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        border: '#e5e5e5',
        'border-dark': '#000000',
        'muted': '#737373',
        'muted-light': '#f5f5f5',
        'muted-dark': '#262626'
      }
    },
  },
  plugins: [],
}

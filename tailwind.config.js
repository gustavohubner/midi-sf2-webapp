/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'panel-bg': '#1a1a1a',
        'panel-red': '#a81c1c',
        'panel-dark': '#111111',
        'knob-ring': '#333333',
        'display-bg': '#000000',
        'display-text': '#4ecdc4',
        'led-red': '#ff3333',
        'led-off': '#441111',
      },
      fontFamily: {
        'display': ['"Courier New"', 'monospace'],
      }
    },
  },
  plugins: [],
}

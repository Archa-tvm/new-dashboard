/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070D1E',
          900: '#0B132B',
          800: '#1C2541',
          700: '#3A506B',
        },
        industrial: {
          good: '#10B981',    // Green
          warning: '#F59E0B', // Amber
          critical: '#EF4444',// Red
          blue: '#2563EB',    // Primary blue
          gray: '#94A3B8',    // No data gray
        }
      }
    },
  },
  plugins: [],
}

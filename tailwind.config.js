/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './buy/**/*.html', './go.html', './towns/**/*.html', './mockups/**/*.html'],
  theme: {
    extend: {
      colors: {
        brand: '#E2001A',
        ink: '#1a1a1a',
        cream: '#fdfcfa',
        parchment: '#f5f0e8',
        rule: '#e6e2dc'
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'sans-serif']
      }
    }
  }
};

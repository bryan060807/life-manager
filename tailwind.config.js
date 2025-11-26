/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="cyberdark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#ff0099',
          cyan: '#00ffff',
          purple: '#b300ff',
          blue: '#0077ff',
        },
        cyber: {
          dark: '#0b0b0b',
          light: '#121212',
          gray: '#1a1a1a',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 10px rgba(255, 0, 153, 0.7), 0 0 20px rgba(0, 255, 255, 0.5)',
        glow: '0 0 8px rgba(179, 0, 255, 0.6)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './data/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fortress: {
          black: '#050506',
          red: '#E11D48',
          green: '#22C55E',
          gold: '#D4AF37',
          silver: '#B9BCC5',
        },
      },
      fontFamily: {
        display: ['Inter', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        metallic: 'linear-gradient(140deg, #9ea2ac, #4d5059 35%, #d1d5df 70%, #646873)',
      },
      keyframes: {
        lightning: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '20%': { opacity: '1', transform: 'scale(1.05)' },
          '80%': { opacity: '0.5', transform: 'scale(1.02)' },
        },
      },
      animation: {
        lightning: 'lightning 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

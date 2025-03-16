/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-dark': '#0a0a0a',
        'card-dark': '#111111',
        'border-dark': '#333333',
        'accent-blue': '#3182CE',
        'border': 'hsl(var(--border))',
        'background': 'hsl(var(--background))',
        'foreground': 'hsl(var(--foreground))',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(to bottom, #111111, #050505)',
        'gradient-card': 'linear-gradient(to right, #1a1a1a, #151515)',
      },
      boxShadow: {
        'card': '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
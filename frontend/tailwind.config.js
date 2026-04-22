/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'apple-accent': '#007aff',
        'apple-accent-hover': '#0071e3',
        'apple-accent-light': '#e8f1ff',
        'apple-success': '#34c759',
        'apple-error': '#ff3b30',
        'apple-warning': '#ff9500',
      },
    },
  },
  plugins: [],
};

module.exports = config;

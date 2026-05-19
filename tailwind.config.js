/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#EA0029',
        dark: '#000',
        light: '#FFF',
        'medium-gray': '#606060',
      },
      fontFamily: {
        header: ['Oswald', 'sans-serif'],
        body: ['Lato', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

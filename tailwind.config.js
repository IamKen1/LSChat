/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4c669f',
          DEFAULT: '#3b5998',
          dark: '#192f6a',
        },
        secondary: {
          light: '#f5f5f5',
          DEFAULT: '#ffffff',
          dark: '#e0e0e0',
        },
        accent: {
          light: '#007AFF',
          DEFAULT: '#005BB5',
          dark: '#003F7F',
        },
      },
    },
  },
  plugins: [],
}
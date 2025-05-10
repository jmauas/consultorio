/** @type {import('tailwindcss').Config} */

module.exports = {
  // Otras configuraciones existentes...
  theme: {
    extend: {
      fontFamily: {
        trebu: ['Trebuchet MS', 'sans-serif'], 
      },
      animation: {
        'fadeIn': 'fadeIn 1s ease-in-out',
        'bounceIn': 'bounceIn 0.4s ease-in-out',  // Añadimos la animación bounceIn
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        fadeIn: {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 },
        },
      }
    },
  },
  plugins: [],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
}
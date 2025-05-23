/** @type {import('tailwindcss').Config} */
module.exports = {
content: [
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  // If you have any UI components in the 'pages' directory (not just API routes)
  // "./pages/**/*.{js,ts,jsx,tsx,mdx}",
],
  theme: {
    extend: {
      colors: {
        pastelBlue: "#a7c7e7",
        pastelMint: "#b6e3c6",
        slateText: "#374151",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}

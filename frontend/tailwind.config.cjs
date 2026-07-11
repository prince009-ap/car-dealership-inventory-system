/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2563eb",
          secondary: "#4f46e5",
          accent: "#06b6d4"
        }
      }
    }
  },
  plugins: []
};

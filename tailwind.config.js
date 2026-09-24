/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "#56614A",
          tealLight: "#6B7B5A",
          amber: "#C9B89F",
          amberLight: "#EDE6D8",
          sage: "#4B3A2F",
          sageLight: "#F8F5EE",
          sand: "#FDF8F0",
          sandDark: "#EDE6D8",
          plum: "#4A235A",
          ink: "#1A2E2E",
          marrom: "#4B3A2F",
          musgo: "#56614A",
          bege: "#EDE6D8",
          areia: "#C9B89F",
          branco: "#F8F5EE"
        }
      },
      fontFamily: {
        display: ["Fraunces", "'Noto Serif Display'", "serif"],
        body: ["Inter", "'Noto Sans'", "system-ui", "sans-serif"],
        serifBrand: ["'Noto Serif Display'", "Fraunces", "serif"],
        sansBrand: ["'Noto Sans'", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

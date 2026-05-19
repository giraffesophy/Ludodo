export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans TC"', "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        deerOrange: "#F97316",
        lakeBlue: "#2563EB",
        softBlue: "#EAF3FF"
      },
      boxShadow: {
        soft: "0 20px 60px rgb(15 23 42 / 0.12)"
      }
    }
  },
  plugins: []
};

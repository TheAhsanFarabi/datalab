/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBFBF6",
        ink: "#21303F",
        inkmute: "#5C6B7A",
        line: "#E5E4DA",
        sprout: { DEFAULT: "#2FAE60", dark: "#1F8A49", soft: "#E4F6EB" },
        pymode: { DEFAULT: "#2D7FF9", soft: "#E8F1FE" },
        sqlmode: { DEFAULT: "#8B5CF6", soft: "#F1EBFE" },
        xlmode: { DEFAULT: "#E8930C", soft: "#FDF1DC" },
        flame: "#F4733F",
        gold: "#F2B705"
      },
      fontFamily: {
        display: ["Nunito", "ui-rounded", "system-ui", "sans-serif"],
        body: ["Nunito", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "Menlo", "monospace"]
      },
      boxShadow: {
        card: "0 1px 0 #E5E4DA, 0 4px 14px rgba(33,48,63,0.06)",
        btn: "0 2px 0 rgba(0,0,0,0.18)"
      },
      keyframes: {
        pop: { "0%": { transform: "scale(0.6)", opacity: "0" }, "70%": { transform: "scale(1.08)" }, "100%": { transform: "scale(1)", opacity: "1" } },
        confetti: { "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: "1" }, "100%": { transform: "translateY(70vh) rotate(540deg)", opacity: "0" } },
        barup: { "0%": { transform: "scaleY(0)" }, "100%": { transform: "scaleY(1)" } }
      },
      animation: {
        pop: "pop .35s cubic-bezier(.34,1.56,.64,1) both",
        barup: "barup .6s cubic-bezier(.34,1.2,.64,1) both"
      }
    }
  },
  plugins: []
};

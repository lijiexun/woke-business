import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#f4f2ec",
        panel: "#fcfbf8",
        ink: "#1f2937",
        accent: "#0f766e",
        accentSoft: "#99f6e4"
      }
    }
  },
  plugins: []
};

export default config;
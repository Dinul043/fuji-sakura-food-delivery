// Tailwind v4 — theme is configured in globals.css via @theme
// This file only tells Tailwind where to scan for classes
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
} satisfies Config;

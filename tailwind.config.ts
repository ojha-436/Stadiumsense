import type { Config } from "tailwindcss";

// StadiumSense design tokens.
//
// Colours resolve to CSS custom properties (RGB channel triplets) defined in
// index.css for the light and dark themes. Because every semantic family points
// at a variable, the whole app re-themes by toggling one class on <html> — no
// per-component colour changes. The legacy `night/surface/pitch/flag` names are
// kept and mapped so existing markup themes automatically; new code should
// prefer the semantic aliases (bg-canvas, text-fg, bg-primary, …).
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Semantic aliases (preferred) ───────────────────────────────────
        canvas: withAlpha("--canvas"),
        inset: withAlpha("--inset"),
        fg: {
          DEFAULT: withAlpha("--fg"),
          muted: withAlpha("--fg-muted"),
        },
        primary: {
          DEFAULT: withAlpha("--primary"),
          fg: withAlpha("--primary-fg"),
          400: withAlpha("--primary-400"),
          600: withAlpha("--primary-600"),
        },
        accent: {
          DEFAULT: withAlpha("--accent"),
          2: withAlpha("--accent-2"),
        },

        // ── Legacy names mapped onto the same theme variables ───────────────
        night: {
          DEFAULT: withAlpha("--canvas"),
          50: withAlpha("--fg"),
          100: withAlpha("--fg-muted"),
          800: withAlpha("--surface-2"),
          900: withAlpha("--canvas"),
          950: withAlpha("--inset"),
        },
        surface: {
          DEFAULT: withAlpha("--surface"),
          raised: withAlpha("--surface-2"),
          border: withAlpha("--border"),
        },
        pitch: {
          DEFAULT: withAlpha("--primary"),
          400: withAlpha("--primary-400"),
          500: withAlpha("--primary"),
          600: withAlpha("--primary-600"),
        },
        flag: {
          red: withAlpha("--danger"),
          gold: withAlpha("--accent"),
          blue: withAlpha("--accent-2"),
        },
      },
      fontFamily: {
        sans: ['"Public Sans"', "system-ui", "sans-serif"],
        display: ['"Archivo"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--shadow) / 0.04), 0 8px 24px -12px rgb(var(--shadow) / 0.18)",
        pop: "0 12px 40px -12px rgb(var(--shadow) / 0.35)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

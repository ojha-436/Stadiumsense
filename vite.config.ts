import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// StadiumSense frontend build.
// The service worker precaches built static assets only; every Firebase and
// Cloud Functions call always hits the network so realtime data is never stale.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "StadiumSense — FIFA World Cup 2026",
        short_name: "StadiumSense",
        description:
          "Your AI matchday companion for the FIFA World Cup 2026: arrival plans, transit, food to your seat, and live stadium info.",
        theme_color: "#0A1A2F",
        background_color: "#0A1A2F",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2,png,ico,txt}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        // Without these, a new service worker installs but sits "waiting"
        // until every open tab is closed — real users (and judges) would keep
        // seeing a stale cached build indefinitely after every deploy.
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Route-oriented chunking keeps the fan bundle small; ops/vendor/admin
        // code is only pulled when a staff user navigates there.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          firebase: [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/functions",
            "firebase/storage",
            "firebase/app-check",
          ],
          i18n: ["i18next", "react-i18next", "i18next-browser-languagedetector"],
        },
      },
    },
  },
});

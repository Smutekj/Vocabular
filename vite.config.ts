import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: '/Vocabular/',   // 👈 important
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // automatically updates service worker
      includeAssets: [
          "Icons/*.png", "Images/*.png",
         "*.csv",
          "projectx.js",  "service-worker.js"],
      manifest: {
        name: "Vocabulary Learning Game App",
        short_name: "Vocabular",
        description: "Practice learning vocabulary with fun games!",
        theme_color: "#B12A34",
        background_color: "#B12A34",
        display: "standalone",
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        navigateFallback: "index.html",
        maximumFileSizeToCacheInBytes: 30000000,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "CacheFirst",
            options: {
              cacheName: "html-cache",
            },
          },
          {
            urlPattern: ({ request }) =>
              ["style", "script", "worker"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "asset-cache",
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: ({ request }) => request.url.endsWith(".wasm"),
            handler: "CacheFirst",
            options: {
              cacheName: "wasm-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          }
        ],
      },
    })
  ]
})

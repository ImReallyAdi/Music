import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['adi.png', 'adi.ico'],
          manifest: {
            name: 'Adi Music',
            short_name: 'Music',
            description: 'Stream and organize your personal music library.',
            categories: ["music", "entertainment", "multimedia"],
            id: "/",
            start_url: "/?source=pwa",
            scope: "/",
            display: "standalone",
            display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
            orientation: "portrait-primary",
            background_color: '#121016', // Using --md-sys-color-surface value
            theme_color: '#121016',
            icons: [
              {
                src: 'adi.png',
                sizes: '192x192', // Assuming adi.png can be used here, ideally we'd have specific sizes
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'adi.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'adi.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            shortcuts: [
                {
                  name: "Search",
                  short_name: "Search",
                  url: "/",
                  icons: [{ src: "adi.png", sizes: "192x192", type: "image/png" }]
                },
                {
                  name: "My Library",
                  short_name: "Library",
                  url: "/",
                  icons: [{ src: "adi.png", sizes: "192x192", type: "image/png" }]
                }
            ],
            screenshots: [
                {
                  src: "adi.png", // Using adi.png as placeholder for screenshot if no actual screenshot exists
                  sizes: "1170x2532",
                  type: "image/png",
                  form_factor: "narrow",
                  label: "Now Playing Screen"
                },
                {
                  src: "adi.png",
                  sizes: "1920x1080",
                  type: "image/png",
                  form_factor: "wide",
                  label: "Desktop Library View"
                }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'jsdom',
        globals: true,
      }
    };
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served through DDEV on https://communities.ddev.site so the Google
// session cookie stays first-party. `vite --mode test` is only for the
// Playwright server, on localhost, without that origin.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: mode === 'test'
    ? {
        host: '127.0.0.1',
        port: 5174,
        strictPort: true,
        hmr: false,
      }
    : {
        host: true,
        port: 5173,
        strictPort: true,
        origin: 'https://communities.ddev.site',
        allowedHosts: ['communities.ddev.site'],
        // The dev server runs inside the DDEV web container. Bind mounts
        // do not deliver inotify events, so polling is required there.
        watch: {
          usePolling: true,
          interval: 300,
        },
        hmr: {
          host: 'communities.ddev.site',
          protocol: 'wss',
          clientPort: 443,
        },
      },
}))

import { defineConfig, devices } from '@playwright/test'

const mobile = { width: 375, height: 812 }
const desktop = { width: 1280, height: 800 }

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --mode test --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'], viewport: mobile, deviceScaleFactor: 1 },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: desktop },
    },
  ],
})

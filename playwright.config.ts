import { defineConfig, devices } from '@playwright/test';

// Web smoke check: serves the production build (`npm run build` first) and opens it in Chromium.
const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npm run preview',
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
});

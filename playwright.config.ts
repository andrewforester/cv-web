import { createHash } from 'node:crypto';
import { defineConfig, devices } from '@playwright/test';

// Web smoke check: serves the production build (`npm run build` first) and opens it in Chromium.
// CI uses 4173. Locally the port comes from the worktree path (override: PW_PORT), so parallel
// worktrees never share a server; a busy port fails (`--strictPort`) instead of being reused.
function worktreePort(): number {
  const hash = createHash('sha1').update(process.cwd()).digest().readUInt16BE(0);
  return 4200 + (hash % 800);
}

// PW_BASE_URL (e.g. production) tests that deployment: no local server is started.
const BASE_URL = process.env.PW_BASE_URL;
const PORT = Number(process.env.PW_PORT) || (process.env.CI ? 4173 : worktreePort());

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: BASE_URL ?? `http://localhost:${PORT}/`,
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
    // The page's motion is off, so screenshots show every part at rest (motion: unit tests).
    contextOptions: { reducedMotion: 'reduce' },
  },
  webServer: BASE_URL
    ? undefined
    : {
        command: `npx vite preview --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}/`,
        reuseExistingServer: false,
      },
});

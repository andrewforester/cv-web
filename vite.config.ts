/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { chatApiPlugin } from './server/dev/chatApiPlugin.ts';
import { SECURITY_HEADERS } from './scripts/securityHeaders.ts';

// Vercel serves the site from the root of its domain.
export default defineConfig({
  base: '/',
  plugins: [react(), chatApiPlugin()],
  // `vite preview` (the web check) sends what Vercel sends in production.
  preview: { headers: SECURITY_HEADERS },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'web',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          // `?raw` CSS (the retro show's damage layers) must return the file text, not ''.
          css: { include: [/\.css\?raw$/], modules: { classNameStrategy: 'non-scoped' } },
        },
      },
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          setupFiles: ['./server/test/setup.ts'],
          include: ['server/**/*.test.ts', 'scripts/**/*.test.ts'],
        },
      },
    ],
  },
});

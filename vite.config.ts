/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { chatApiPlugin } from './server/dev/chatApiPlugin.ts';

// Vercel serves the site from the root of its domain.
export default defineConfig({
  base: '/',
  plugins: [react(), chatApiPlugin()],
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
          css: { modules: { classNameStrategy: 'non-scoped' } },
        },
      },
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          setupFiles: ['./server/test/setup.ts'],
          include: ['server/**/*.test.ts'],
        },
      },
    ],
  },
});

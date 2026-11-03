// server/vitest.config.ts

// Vitest configuration for the server workspace running unit and integration suites.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 10000,
    fileParallelism: false,
  },
});

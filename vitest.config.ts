import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        '**/*.config.*',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/types/**',
        '**/*.d.ts',
        '**/dist/**',
        '**/.next/**',
        '**/coverage/**',
        'vitest.setup.ts',
      ],
      // Coverage thresholds per project requirements
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      // Per-file thresholds for critical modules
      perFile: true,
    },
    include: [
      '**/__tests__/**/*.test.ts',
      '**/__tests__/**/*.test.tsx',
      'lib/**/__tests__/**/*.test.ts',
      'components/**/__tests__/**/*.test.tsx',
    ],
    // Test timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});

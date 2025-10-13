import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: 'src/setupTests.js',
    globals: true,
    css: true,
    exclude: [
        'src/App.test.js',
        'node_modules/**',
        'dist/**',
        'build/**',
        'coverage/**',
        '.next/**',
        '.nuxt/**',
        '.output/**'
    ]
  }
});

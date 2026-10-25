import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@tests': fileURLToPath(new URL('./tests', import.meta.url))
    }
  },
  test: {
    include: ['tests/**/*.e2e.test.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      PORT: '0',
      DATABASE_URL: 'postgres://app_user:app_user@localhost:54329/dbiewer_test',
      ADMIN_DATABASE_URL: 'postgres://postgres:postgres@localhost:54329/dbiewer_test',
      BETTER_AUTH_SECRET: 'test-secret-with-at-least-thirty-two-characters',
      BETTER_AUTH_URL: 'http://localhost:4000',
      WEB_URL: 'http://localhost:5173',
      EMAIL_SENDER: 'dummy',
      EMAIL_FROM: 'no-reply@dbiewer.localhost'
    }
  }
});

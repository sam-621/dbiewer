import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['tests/**/*.e2e.test.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      PORT: '0',
      DATABASE_URL: 'postgres://app_user:app_user@localhost:54329/dbiewer_test',
      ADMIN_DATABASE_URL: 'postgres://postgres:postgres@localhost:54329/dbiewer_test'
    }
  }
});

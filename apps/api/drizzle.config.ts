import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/persistence/schema/index.ts',
  out: './database/migrations'
});

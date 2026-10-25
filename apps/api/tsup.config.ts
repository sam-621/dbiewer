import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'node24',
  outDir: 'dist',
  clean: true,
  onSuccess: 'mkdir -p dist/api && cp -R src/api/schema dist/api/schema'
});

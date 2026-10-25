import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'node24',
  outDir: 'dist',
  clean: true,
  onSuccess: 'cp -R src/schema dist/schema'
});

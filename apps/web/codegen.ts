import type { CodegenConfig } from '@graphql-codegen/cli';
import { loadEnv } from 'vite';

const { VITE_API_URL } = loadEnv('development', process.cwd(), '');

const config: CodegenConfig = {
  schema: `${VITE_API_URL}/graphql`,
  documents: ['src/**/*.operations.ts'],
  generates: {
    'src/lib/api/codegen/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' }
      },
      config: {
        documentMode: 'string',
        useTypeImports: true,
        enumsAsTypes: true
      }
    }
  }
};

export default config;

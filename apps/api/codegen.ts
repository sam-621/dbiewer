import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/api/schema/**/*.gql',
  generates: {
    'src/api/codegen.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        useTypeImports: true,
        enumsAsTypes: true
      }
    }
  }
};

export default config;

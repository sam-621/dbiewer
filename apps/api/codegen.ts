import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/schema/**/*.gql',
  generates: {
    'src/shared/graphql/codegen.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '@/shared/context#Context',
        useTypeImports: true,
        enumsAsTypes: true
      }
    }
  }
};

export default config;

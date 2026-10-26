import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/api/schema/**/*.gql',
  generates: {
    'src/api/codegen.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '@/context#RequestContext',
        useTypeImports: true,
        enumsAsTypes: true,
        enumValues: {
          ConnectionSslMode: {
            DISABLE: 'disable',
            REQUIRE: 'require',
            VERIFY_FULL: 'verify-full'
          }
        }
      }
    }
  }
};

export default config;

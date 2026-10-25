import type { Resolvers } from '@/shared/graphql/codegen';

export const SystemResolver: Resolvers = {
  Query: {
    health: () => true
  }
};

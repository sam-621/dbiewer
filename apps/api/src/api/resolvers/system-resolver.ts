import type { Resolvers } from '@/api/codegen';

export const SystemResolver: Resolvers = {
  Query: {
    health: () => true
  }
};

import type { Database } from '@/persistence/database';

export const createUseCases = (_db: Database) => ({});

export type UseCases = ReturnType<typeof createUseCases>;

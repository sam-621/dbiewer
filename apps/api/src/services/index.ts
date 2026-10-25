import type { Database } from '@/persistence/database';

export const createServices = (_db: Database) => ({});

export type Services = ReturnType<typeof createServices>;

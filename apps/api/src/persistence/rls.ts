import { sql } from 'drizzle-orm';

import type { Transaction } from './database';

export type RLSContext = {
  tenantId?: string | null;
};

export type RunWithoutRLS = <T>(fn: () => Promise<T>) => Promise<T>;

export type RepositoryRLS = {
  context: RLSContext;
  runWithoutRLS: RunWithoutRLS;
};

export const enableRLS = async (trx: Transaction, rlsContext: RLSContext) => {
  await trx.execute(sql`select set_config('app.bypass_rls', 'off', true)`);
  await trx.execute(
    sql`select set_config('app.current_tenant_id', ${rlsContext.tenantId ?? ''}, true)`
  );
};

export const disableRLS = async (trx: Transaction) => {
  await trx.execute(sql`select set_config('app.current_tenant_id', '', true)`);
  await trx.execute(sql`select set_config('app.bypass_rls', 'on', true)`);
};

export const runWithoutRLS =
  (trx: Transaction, rlsContext: RLSContext): RunWithoutRLS =>
  async <T>(fn: () => Promise<T>): Promise<T> => {
    await disableRLS(trx);

    try {
      return await fn();
    } finally {
      await enableRLS(trx, rlsContext).catch(() => undefined);
    }
  };

import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { Database, Transaction } from '@/persistence/database';

import { UnitOfWork } from './unit-of-work';

const { error } = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('@/services/logger', () => ({ createLogger: () => ({ error }) }));

const tenantId = crypto.randomUUID();

const execute = vi.fn();
const trx = { execute } as unknown as Transaction;

const transaction = vi.fn();
const database = { transaction } as unknown as Database;

const dialect = new PgDialect();

const getStatements = () => execute.mock.calls.map(([query]) => dialect.sqlToQuery(query as SQL));

describe('UnitOfWork', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    execute.mockResolvedValue(undefined);
    transaction.mockImplementation(async (callback: (tx: Transaction) => Promise<unknown>) =>
      callback(trx)
    );
  });

  test('returns the result of the work', async () => {
    const uow = new UnitOfWork(database, { tenantId });

    const result = await uow.execute(async () => ({ id: '123' }));

    expect(result).toEqual({ id: '123' });
  });

  test('runs the work within a single transaction of the database', async () => {
    const uow = new UnitOfWork(database, { tenantId });
    let receivedTrx: Transaction | undefined;

    await uow.execute(async (_repositories, ctx) => {
      receivedTrx = ctx.trx;

      return 'ok';
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(receivedTrx).toBe(trx);
  });

  test('enables RLS with the tenant before running the work', async () => {
    const uow = new UnitOfWork(database, { tenantId });
    let statementsBeforeWork = 0;

    await uow.execute(async () => {
      statementsBeforeWork = execute.mock.calls.length;

      return 'ok';
    });

    expect(statementsBeforeWork).toBe(2);
    expect(getStatements()).toMatchObject([
      { sql: "select set_config('app.bypass_rls', 'off', true)", params: [] },
      { sql: "select set_config('app.current_tenant_id', $1, true)", params: [tenantId] }
    ]);
  });

  test('gives the work the repositories and the rls context', async () => {
    const uow = new UnitOfWork(database, { tenantId });

    await uow.execute(async (repositories, ctx) => {
      expect(ctx.repositories).toBe(repositories);
      expect(repositories.workspace).toBeDefined();
      expect(ctx.rlsContext).toEqual({ tenantId });

      return 'ok';
    });
  });

  test('runs a function without RLS and enables it again', async () => {
    const uow = new UnitOfWork(database, { tenantId });
    let statementsInside: ReturnType<typeof getStatements> = [];

    await uow.execute(async (_repositories, ctx) => {
      execute.mockClear();

      await ctx.runWithoutRLS(async () => {
        statementsInside = getStatements();
      });

      return 'ok';
    });

    expect(statementsInside).toMatchObject([
      { sql: "select set_config('app.current_tenant_id', '', true)", params: [] },
      { sql: "select set_config('app.bypass_rls', 'on', true)", params: [] }
    ]);
    expect(getStatements().slice(2)).toMatchObject([
      { sql: "select set_config('app.bypass_rls', 'off', true)", params: [] },
      { sql: "select set_config('app.current_tenant_id', $1, true)", params: [tenantId] }
    ]);
  });

  test('throws the original error when the work fails', async () => {
    const uow = new UnitOfWork(database, { tenantId });

    await expect(
      uow.execute(async () => {
        throw new Error('original error');
      })
    ).rejects.toThrow('original error');
  });

  test('throws the original error when the rollback also fails', async () => {
    transaction.mockImplementation(async (callback: (tx: Transaction) => Promise<unknown>) => {
      await callback(trx).catch(() => {
        throw new Error('rollback failed');
      });
    });
    const uow = new UnitOfWork(database, { tenantId });

    await expect(
      uow.execute(async () => {
        throw new Error('original error');
      })
    ).rejects.toThrow('original error');
    expect(error).toHaveBeenCalledWith('Failed to roll back the transaction', {
      error: new Error('rollback failed')
    });
  });
});

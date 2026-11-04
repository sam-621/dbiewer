import { and, asc, desc, eq, getTableColumns, getTableName, isNull } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

import type { Transaction } from '@/persistence/database';

import {
  type FindManyInput,
  type FindOneInput,
  type OrderBy,
  OrderByKey,
  type TableWithId,
  type Where
} from './repository-types';

export abstract class Repository<TTable extends TableWithId> {
  constructor(
    protected readonly trx: Transaction,
    protected readonly table: TTable
  ) {}

  async findMany({ where = {}, orderBy = {} }: FindManyInput<TTable> = {}): Promise<
    TTable['$inferSelect'][]
  > {
    return this.trx
      .select()
      .from(this.table as PgTable)
      .where(this.buildWhere(where))
      .orderBy(...this.buildOrderBy(orderBy));
  }

  async findOne({ where }: FindOneInput<TTable>): Promise<TTable['$inferSelect'] | null> {
    const condition = this.buildWhere(where);

    if (!condition) throw new Error(`findOne on ${getTableName(this.table)} requires a where`);

    const [row] = await this.trx
      .select()
      .from(this.table as PgTable)
      .where(condition)
      .limit(1);

    return row ?? null;
  }

  async insert(values: TTable['$inferInsert']): Promise<TTable['$inferSelect']> {
    const [row] = await this.trx.insert(this.table).values(values).returning();

    if (!row) throw new Error(`Failed to insert row into ${getTableName(this.table)}`);

    return row;
  }

  async update(
    where: Where<TTable>,
    values: Partial<TTable['$inferInsert']>
  ): Promise<TTable['$inferSelect'][]> {
    return this.trx
      .update(this.table as PgTable)
      .set(values)
      .where(this.buildWhere(where))
      .returning();
  }

  async remove(where: Where<TTable>): Promise<TTable['$inferSelect'][]> {
    return this.trx.delete(this.table).where(this.buildWhere(where)).returning();
  }

  private buildWhere(where: Where<TTable>) {
    const columns = getTableColumns(this.table);
    const conditions = (Object.entries(where) as [string, unknown][]).flatMap(([key, value]) => {
      const column = columns[key];

      if (!column || value === undefined) return [];

      return [value === null ? isNull(column) : eq(column, value)];
    });

    return and(...conditions);
  }

  private buildOrderBy(orderBy: OrderBy<TTable>) {
    const columns = getTableColumns(this.table);

    return (Object.entries(orderBy) as [string, OrderByKey | undefined][]).flatMap(
      ([key, direction]) => {
        const column = columns[key];

        if (!column || !direction) return [];

        return [direction === OrderByKey.Desc ? desc(column) : asc(column)];
      }
    );
  }
}

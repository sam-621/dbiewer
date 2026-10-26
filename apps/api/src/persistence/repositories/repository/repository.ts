import { and, eq, getTableColumns, getTableName, isNull } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

import type { Transaction } from '@/persistence/database';

type TableWithId = PgTable & { id: AnyPgColumn };

type Where<TTable extends TableWithId> = Partial<TTable['$inferSelect']>;

export abstract class Repository<TTable extends TableWithId> {
  constructor(
    protected readonly trx: Transaction,
    protected readonly table: TTable
  ) {}

  protected async findMany(where: Where<TTable> = {}): Promise<TTable['$inferSelect'][]> {
    return this.trx
      .select()
      .from(this.table as PgTable)
      .where(this.buildWhere(where));
  }

  protected async findOne(where: Where<TTable>): Promise<TTable['$inferSelect'] | null> {
    const condition = this.buildWhere(where);

    if (!condition) throw new Error(`findOne on ${getTableName(this.table)} requires a where`);

    const [row] = await this.trx
      .select()
      .from(this.table as PgTable)
      .where(condition)
      .limit(1);

    return row ?? null;
  }

  protected async insert(values: TTable['$inferInsert']): Promise<TTable['$inferSelect']> {
    const [row] = await this.trx.insert(this.table).values(values).returning();

    if (!row) throw new Error(`Failed to insert row into ${getTableName(this.table)}`);

    return row;
  }

  protected async update(
    where: Where<TTable>,
    values: Partial<TTable['$inferInsert']>
  ): Promise<TTable['$inferSelect'][]> {
    return this.trx
      .update(this.table as PgTable)
      .set(values)
      .where(this.buildWhere(where))
      .returning();
  }

  protected async remove(where: Where<TTable>): Promise<TTable['$inferSelect'][]> {
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
}

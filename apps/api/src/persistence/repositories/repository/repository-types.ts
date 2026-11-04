import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

export type TableWithId = PgTable & { id: AnyPgColumn };

export type Where<TTable extends TableWithId> = Partial<TTable['$inferSelect']>;

export enum OrderByKey {
  ASC = 'asc',
  DESC = 'desc'
}

export type OrderBy<TTable extends TableWithId> = Partial<
  Record<keyof TTable['$inferSelect'], OrderByKey>
>;

export type FindOneInput<TTable extends TableWithId> = {
  where: Where<TTable>;
};

export type FindManyInput<TTable extends TableWithId> = {
  where?: Where<TTable>;
  orderBy?: OrderBy<TTable>;
};

import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

export type TableWithId = PgTable & { id: AnyPgColumn };

export type Where<TTable extends TableWithId> = Partial<TTable['$inferSelect']>;

export const OrderByKey = {
  Asc: 'asc',
  Desc: 'desc'
} as const;

export type OrderByKey = (typeof OrderByKey)[keyof typeof OrderByKey];

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

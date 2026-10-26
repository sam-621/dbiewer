import { destroyDatabase, testDatabase } from '@tests/utils/database';
import { sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

import { PostgresConnectionFailedError, PostgresQueryFailedError } from './postgres-errors';
import { PostgresService } from './postgres-service';

const getTestConnection = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) throw new Error('DATABASE_URL is required for integration tests');

  const url = new URL(databaseUrl);

  return {
    id: '00000000-0000-0000-0000-000000000001',
    host: url.hostname,
    port: Number(url.port),
    database: url.pathname.slice(1),
    username: url.username,
    password: url.password,
    sslMode: 'disable' as const
  };
};

const BACKEND_PID_SQL = 'select pg_backend_pid() as pid';

describe('PostgresService', () => {
  const postgresService = new PostgresService();

  afterEach(async () => {
    await postgresService.closePools();
  });

  afterAll(async () => {
    await destroyDatabase();
  });

  test('returns the rows of a parameterized query', async () => {
    const result = await postgresService.query<{ value: string }>(
      getTestConnection(),
      'select $1::text as value',
      ['dbiewer']
    );

    expect(result.rows).toEqual([{ value: 'dbiewer' }]);
  });

  test('opens the clients with a statement timeout of 30 seconds', async () => {
    const result = await postgresService.query<{ statement_timeout: string }>(
      getTestConnection(),
      'show statement_timeout'
    );

    expect(result.rows).toEqual([{ statement_timeout: '30s' }]);
  });

  test('reuses the client of the connection pool', async () => {
    const first = await postgresService.query<{ pid: number }>(
      getTestConnection(),
      BACKEND_PID_SQL
    );
    const second = await postgresService.query<{ pid: number }>(
      getTestConnection(),
      BACKEND_PID_SQL
    );

    expect(second.rows[0]?.pid).toBe(first.rows[0]?.pid);
  });

  test('opens at most 3 clients per connection', async () => {
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        postgresService.query<{ pid: number }>(
          getTestConnection(),
          'select pg_backend_pid() as pid, pg_sleep(0.2)'
        )
      )
    );

    expect(new Set(results.map(result => result.rows[0]?.pid)).size).toBe(3);
  });

  test('opens a new client after the pool is discarded', async () => {
    const first = await postgresService.query<{ pid: number }>(
      getTestConnection(),
      BACKEND_PID_SQL
    );

    await postgresService.discardPool(getTestConnection().id);

    const second = await postgresService.query<{ pid: number }>(
      getTestConnection(),
      BACKEND_PID_SQL
    );

    expect(second.rows[0]?.pid).not.toBe(first.rows[0]?.pid);
  });

  describe('readSchemas', () => {
    beforeAll(async () => {
      await testDatabase.execute(
        sql.raw(`
          create schema library;
          create table library.authors (id integer primary key, name text not null);
          create table library.books (
            id integer primary key,
            author_id integer references library.authors (id),
            title varchar(200) not null
          );
          create view library.book_titles as select id, title from library.books;
          create function library.book_count(author integer) returns bigint
            language sql as 'select count(*) from library.books where author_id = author';
        `)
      );
    });

    afterAll(async () => {
      await testDatabase.execute(sql.raw('drop schema library cascade'));
    });

    test('returns the tables, views and functions of a schema', async () => {
      const schemas = await postgresService.readSchemas(getTestConnection());

      expect(schemas.find(schema => schema.name === 'library')).toEqual({
        name: 'library',
        tables: [
          {
            name: 'authors',
            estimatedRows: null,
            columns: [
              { name: 'id', type: 'integer', isPrimaryKey: true, isForeignKey: false },
              { name: 'name', type: 'text', isPrimaryKey: false, isForeignKey: false }
            ]
          },
          {
            name: 'books',
            estimatedRows: null,
            columns: [
              { name: 'id', type: 'integer', isPrimaryKey: true, isForeignKey: false },
              { name: 'author_id', type: 'integer', isPrimaryKey: false, isForeignKey: true },
              {
                name: 'title',
                type: 'character varying(200)',
                isPrimaryKey: false,
                isForeignKey: false
              }
            ]
          }
        ],
        views: [
          {
            name: 'book_titles',
            columns: [
              { name: 'id', type: 'integer', isPrimaryKey: false, isForeignKey: false },
              {
                name: 'title',
                type: 'character varying(200)',
                isPrimaryKey: false,
                isForeignKey: false
              }
            ]
          }
        ],
        functions: [{ name: 'book_count', arguments: 'author integer', kind: 'function' }]
      });
    });
  });

  describe('readTableStructure and readTableRows', () => {
    beforeAll(async () => {
      await testDatabase.execute(
        sql.raw(`
          create schema library;
          create table library.authors (id integer primary key, name text not null);
          create table library.books (
            id integer primary key,
            author_id integer references library.authors (id) on delete cascade,
            title varchar(200) not null,
            price numeric(10, 2),
            published_on date default current_date,
            constraint books_title_key unique (title)
          );
          create index books_author_id_idx on library.books (author_id);
          create view library.cheap_books as select id, title from library.books where price < 10;
          insert into library.authors values (1, 'Ada'), (2, 'Grace');
          insert into library.books values
            (1, 1, 'Notes on the Analytical Engine', 12.50, '1843-10-01'),
            (2, 2, 'COBOL Manual', 8.00, null),
            (3, 1, 'It''s; drop table library.books; --', 5.25, null);
          create table library.loans (id integer primary key, status text not null);
          insert into library.loans
            select id, case when id % 2 = 0 then 'open' else 'closed' end
            from generate_series(60, 1, -1) as id;
          grant usage on schema library to "${getTestConnection().username}";
          grant select on all tables in schema library to "${getTestConnection().username}";
        `)
      );
    });

    afterAll(async () => {
      await testDatabase.execute(sql.raw('drop schema library cascade'));
    });

    test('returns the structure of a table with its definition', async () => {
      const structure = await postgresService.readTableStructure(getTestConnection(), {
        schema: 'library',
        name: 'books'
      });

      expect(structure).toEqual({
        columns: [
          { name: 'id', type: 'integer', isNullable: false, default: null, isPrimaryKey: true },
          {
            name: 'author_id',
            type: 'integer',
            isNullable: true,
            default: null,
            isPrimaryKey: false
          },
          {
            name: 'title',
            type: 'character varying(200)',
            isNullable: false,
            default: null,
            isPrimaryKey: false
          },
          {
            name: 'price',
            type: 'numeric(10,2)',
            isNullable: true,
            default: null,
            isPrimaryKey: false
          },
          {
            name: 'published_on',
            type: 'date',
            isNullable: true,
            default: 'CURRENT_DATE',
            isPrimaryKey: false
          }
        ],
        indexes: [
          {
            name: 'books_author_id_idx',
            definition: 'CREATE INDEX books_author_id_idx ON library.books USING btree (author_id)',
            isUnique: false
          },
          {
            name: 'books_pkey',
            definition: 'CREATE UNIQUE INDEX books_pkey ON library.books USING btree (id)',
            isUnique: true
          },
          {
            name: 'books_title_key',
            definition: 'CREATE UNIQUE INDEX books_title_key ON library.books USING btree (title)',
            isUnique: true
          }
        ],
        foreignKeys: [
          {
            columns: ['author_id'],
            referencedSchema: 'library',
            referencedTable: 'authors',
            referencedColumns: ['id'],
            onDelete: 'CASCADE'
          }
        ],
        definition: [
          'CREATE TABLE "library"."books" (',
          '  "id" integer NOT NULL,',
          '  "author_id" integer,',
          '  "title" character varying(200) NOT NULL,',
          '  "price" numeric(10,2),',
          '  "published_on" date DEFAULT CURRENT_DATE,',
          '  CONSTRAINT "books_pkey" PRIMARY KEY (id),',
          '  CONSTRAINT "books_title_key" UNIQUE (title),',
          '  CONSTRAINT "books_author_id_fkey" FOREIGN KEY (author_id) REFERENCES library.authors(id) ON DELETE CASCADE',
          ');'
        ].join('\n')
      });
    });

    test('returns the structure of a view with its definition and no indexes or foreign keys', async () => {
      const structure = await postgresService.readTableStructure(getTestConnection(), {
        schema: 'library',
        name: 'cheap_books'
      });

      expect(structure).toEqual({
        columns: [
          { name: 'id', type: 'integer', isNullable: true, default: null, isPrimaryKey: false },
          {
            name: 'title',
            type: 'character varying(200)',
            isNullable: true,
            default: null,
            isPrimaryKey: false
          }
        ],
        indexes: [],
        foreignKeys: [],
        definition: ' SELECT id,\n    title\n   FROM library.books\n  WHERE price < 10::numeric;'
      });
    });

    test('returns null when the table does not exist', async () => {
      const structure = await postgresService.readTableStructure(getTestConnection(), {
        schema: 'library',
        name: 'missing_table'
      });

      expect(structure).toBeNull();
    });

    test('returns the rows as text with the total of the table', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        filters: [],
        orderBy: { column: 'id', direction: 'ASC' },
        primaryKeyColumns: ['id'],
        page: 1
      });

      expect(tableRows).toEqual({
        rows: [
          ['1', '1', 'Notes on the Analytical Engine', '12.50', '1843-10-01'],
          ['2', '2', 'COBOL Manual', '8.00', null],
          ['3', '1', "It's; drop table library.books; --", '5.25', null]
        ],
        totalRows: 3
      });
    });

    test('returns the rows ordered by the given column', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        filters: [],
        orderBy: { column: 'title', direction: 'DESC' },
        primaryKeyColumns: ['id'],
        page: 1
      });

      expect(tableRows).toEqual({
        rows: [
          ['1', '1', 'Notes on the Analytical Engine', '12.50', '1843-10-01'],
          ['3', '1', "It's; drop table library.books; --", '5.25', null],
          ['2', '2', 'COBOL Manual', '8.00', null]
        ],
        totalRows: 3
      });
    });

    test('returns the second page ordered by the primary key when there is no order', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'loans',
        filters: [],
        orderBy: null,
        primaryKeyColumns: ['id'],
        page: 2
      });

      expect(tableRows).toEqual({
        rows: [
          ['51', 'closed'],
          ['52', 'open'],
          ['53', 'closed'],
          ['54', 'open'],
          ['55', 'closed'],
          ['56', 'open'],
          ['57', 'closed'],
          ['58', 'open'],
          ['59', 'closed'],
          ['60', 'open']
        ],
        totalRows: 60
      });
    });

    test('breaks ties of the given column by the primary key', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'loans',
        filters: [],
        orderBy: { column: 'status', direction: 'ASC' },
        primaryKeyColumns: ['id'],
        page: 2
      });

      expect(tableRows).toEqual({
        rows: [
          ['42', 'open'],
          ['44', 'open'],
          ['46', 'open'],
          ['48', 'open'],
          ['50', 'open'],
          ['52', 'open'],
          ['54', 'open'],
          ['56', 'open'],
          ['58', 'open'],
          ['60', 'open']
        ],
        totalRows: 60
      });
    });

    test('returns the rows that match all the filters', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        filters: [
          { column: 'author_id', operator: 'EQ', value: '1' },
          { column: 'price', operator: 'GTE', value: '10' }
        ],
        orderBy: null,
        primaryKeyColumns: ['id'],
        page: 1
      });

      expect(tableRows).toEqual({
        rows: [['1', '1', 'Notes on the Analytical Engine', '12.50', '1843-10-01']],
        totalRows: 1
      });
    });

    test('returns the rows whose column contains the value ignoring case', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        filters: [{ column: 'title', operator: 'CONTAINS', value: 'cobol' }],
        orderBy: null,
        primaryKeyColumns: ['id'],
        page: 1
      });

      expect(tableRows).toEqual({
        rows: [['2', '2', 'COBOL Manual', '8.00', null]],
        totalRows: 1
      });
    });

    test('returns the rows whose column is null', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        filters: [{ column: 'published_on', operator: 'IS_NULL' }],
        orderBy: { column: 'id', direction: 'ASC' },
        primaryKeyColumns: ['id'],
        page: 1
      });

      expect(tableRows).toEqual({
        rows: [
          ['2', '2', 'COBOL Manual', '8.00', null],
          ['3', '1', "It's; drop table library.books; --", '5.25', null]
        ],
        totalRows: 2
      });
    });

    test('does not run the value of a filter as SQL', async () => {
      const tableRows = await postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        filters: [{ column: 'title', operator: 'EQ', value: "x' or '1'='1" }],
        orderBy: null,
        primaryKeyColumns: ['id'],
        page: 1
      });

      expect(tableRows).toEqual({ rows: [], totalRows: 0 });
    });

    test('throws PostgresQueryFailedError when a filter value is invalid for the column type', async () => {
      const tableRows = postgresService.readTableRows(getTestConnection(), {
        schema: 'library',
        name: 'books',
        filters: [{ column: 'id', operator: 'EQ', value: 'abc' }],
        orderBy: null,
        primaryKeyColumns: ['id'],
        page: 1
      });

      await expect(tableRows).rejects.toThrow(PostgresQueryFailedError);
      await expect(tableRows).rejects.toThrow('invalid input syntax for type integer: "abc"');
    });
  });

  test('throws PostgresConnectionFailedError when it cannot connect', async () => {
    const connection = { ...getTestConnection(), password: 'wrong-password' };

    await expect(postgresService.query(connection, 'select 1')).rejects.toThrow(
      PostgresConnectionFailedError
    );
  });

  test('throws PostgresQueryFailedError with the message of Postgres when the query fails', async () => {
    const query = postgresService.query(getTestConnection(), 'select * from missing_table');

    await expect(query).rejects.toThrow(PostgresQueryFailedError);
    await expect(query).rejects.toThrow('relation "missing_table" does not exist');
  });
});
